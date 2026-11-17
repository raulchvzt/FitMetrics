import { getPool, sql } from '../config/db.js';
import { desdeKg } from '../utils/unidades.js';
import {
  agrupacionDelPeriodo, agruparPorPeriodo, frecuenciaPorDiaSemana,
  variacion, estadoVolumen, aCsv
} from '../utils/reportes.js';
import { obtenerPerfil } from './auth.service.js';
import { obtenerObjetivos } from './progreso.service.js';
import * as suplementosService from './suplementos.service.js';

const ZONA_HORARIA = process.env.ZONA_HORARIA || 'Central Standard Time (Mexico)';

// Fechas locales del periodo: los últimos N días contando hoy
const PERIODO_SQL = `
  DECLARE @hoy    DATE = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE);
  DECLARE @inicio DATE = DATEADD(DAY, 1 - @dias, @hoy);
`;

function redondear(valor, decimales = 1) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

// ---------- Resumen del dashboard ----------

export async function resumen(usuarioId, dias) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('dias', sql.Int, dias)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      ${PERIODO_SQL}
      DECLARE @inicioAnterior DATE = DATEADD(DAY, -@dias, @inicio);

      -- Sesiones terminadas del periodo actual y del anterior, ya con sus totales
      DECLARE @Sesiones TABLE (
        SesionId INT PRIMARY KEY, Dia DATE NOT NULL, Minutos INT NULL, Actual BIT NOT NULL,
        Series INT NOT NULL, Efectivas INT NOT NULL, VolumenKg DECIMAL(12,3) NOT NULL
      );

      INSERT INTO @Sesiones
      SELECT x.SesionId, x.Dia, DATEDIFF(MINUTE, x.FechaInicio, x.FechaFin),
             CASE WHEN x.Dia >= @inicio THEN 1 ELSE 0 END,
             t.Series, t.Efectivas, t.VolumenKg
      FROM (
        SELECT SesionId, FechaInicio, FechaFin,
               CAST(FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE) AS Dia
        FROM Sesiones
        WHERE UsuarioId = @usuarioId
          AND FechaFin IS NOT NULL
          AND FechaInicio >= DATEADD(DAY, -2 * @dias - 2, SYSUTCDATETIME())
      ) x
      CROSS APPLY (
        SELECT COUNT(*) AS Series,
               ISNULL(SUM(CASE WHEN se.EsEfectiva = 1 THEN 1 ELSE 0 END), 0) AS Efectivas,
               ISNULL(SUM(CASE WHEN se.EsCalentamiento = 0 THEN se.PesoKg * se.Reps ELSE 0 END), 0) AS VolumenKg
        FROM Series se
        WHERE se.SesionId = x.SesionId
      ) t
      WHERE x.Dia >= @inicioAnterior AND x.Dia <= @hoy;

      -- 1. Fechas del periodo
      SELECT CONVERT(CHAR(10), @inicio, 23) AS inicio, CONVERT(CHAR(10), @hoy, 23) AS fin;

      -- 2. Totales del periodo actual y del anterior
      SELECT Actual AS actual,
             COUNT(*) AS sesiones,
             COUNT(DISTINCT Dia) AS diasEntrenados,
             AVG(Minutos) AS minutosPromedio,
             SUM(Series) AS series,
             SUM(Efectivas) AS seriesEfectivas,
             SUM(VolumenKg) AS volumenKg
      FROM @Sesiones
      GROUP BY Actual;

      -- 3. Totales por día (se agrupan en semanas o meses en JavaScript)
      SELECT CONVERT(CHAR(10), Dia, 23) AS dia,
             COUNT(*) AS sesiones,
             SUM(Efectivas) AS seriesEfectivas,
             SUM(VolumenKg) AS volumenKg
      FROM @Sesiones
      WHERE Actual = 1
      GROUP BY Dia
      ORDER BY Dia;

      -- 4. Ejercicios más trabajados
      SELECT TOP 5 e.EjercicioId AS id, e.Nombre AS nombre,
             COUNT(DISTINCT s.SesionId) AS sesiones,
             SUM(CASE WHEN se.EsEfectiva = 1 THEN 1 ELSE 0 END) AS seriesEfectivas,
             NULLIF(MAX(CASE WHEN se.EsCalentamiento = 0 THEN se.E1RM END), 0) AS mejorE1rmKg
      FROM @Sesiones s
      JOIN Series se    ON se.SesionId = s.SesionId
      JOIN Ejercicios e ON e.EjercicioId = se.EjercicioId
      WHERE s.Actual = 1
      GROUP BY e.EjercicioId, e.Nombre
      ORDER BY seriesEfectivas DESC, sesiones DESC, e.Nombre;

      -- 5. Series efectivas por músculo (ponderadas por el factor)
      SELECT em.GrupoMuscularId AS grupoMuscularId, SUM(em.Factor) AS series
      FROM @Sesiones s
      JOIN Series se ON se.SesionId = s.SesionId AND se.EsEfectiva = 1
      JOIN EjercicioMusculos em ON em.EjercicioId = se.EjercicioId
      WHERE s.Actual = 1
      GROUP BY em.GrupoMuscularId;

      -- 6. Tomas de suplementos en el periodo
      SELECT m.SuplementoId AS id, COUNT(*) AS tomas
      FROM MovimientosInventario m
      JOIN Suplementos su ON su.SuplementoId = m.SuplementoId
      WHERE su.UsuarioId = @usuarioId
        AND m.Tipo = 'Consumo'
        AND m.Fecha >= DATEADD(DAY, -@dias - 2, SYSUTCDATETIME())
        AND CAST(m.Fecha AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE) >= @inicio
      GROUP BY m.SuplementoId;
    `);

  const [[periodo], totalesFilas, porDia, ejercicios, porMusculo, tomas] = result.recordsets;

  const [perfil, objetivos, inventario] = await Promise.all([
    obtenerPerfil(usuarioId),
    obtenerObjetivos(usuarioId),
    suplementosService.listar(usuarioId)
  ]);
  const unidad = perfil.unidadPeso;

  // ----- Totales con su comparación -----
  const vacio = { sesiones: 0, diasEntrenados: 0, minutosPromedio: null, series: 0, seriesEfectivas: 0, volumenKg: 0 };
  const actual = totalesFilas.find((t) => t.actual) ?? vacio;
  const anterior = totalesFilas.find((t) => !t.actual) ?? vacio;
  const semanasDelPeriodo = dias / 7;

  const totales = {
    sesiones: actual.sesiones,
    diasEntrenados: actual.diasEntrenados,
    sesionesPorSemana: redondear(actual.sesiones / semanasDelPeriodo),
    minutosPromedio: actual.minutosPromedio,
    series: actual.series,
    seriesEfectivas: actual.seriesEfectivas,
    volumen: desdeKg(actual.volumenKg, unidad),
    variacion: {
      sesiones: variacion(actual.sesiones, anterior.sesiones),
      seriesEfectivas: variacion(actual.seriesEfectivas, anterior.seriesEfectivas),
      volumen: variacion(actual.volumenKg, anterior.volumenKg)
    }
  };

  // ----- Evolución por semana o mes -----
  const agrupacion = agrupacionDelPeriodo(dias);
  const evolucion = agruparPorPeriodo(porDia, { ...periodo, agrupacion })
    .map(({ volumenKg, ...g }) => ({ ...g, volumen: desdeKg(volumenKg, unidad) }));

  // ----- Músculos contra su rango -----
  const seriesPorMusculo = new Map(porMusculo.map((m) => [m.grupoMuscularId, m.series]));
  const musculos = objetivos.musculos.map((o) => {
    const series = seriesPorMusculo.get(o.grupoMuscularId) ?? 0;
    const promedioSemanal = redondear(series / semanasDelPeriodo);
    return {
      id: o.grupoMuscularId,
      musculo: o.musculo,
      series,
      promedioSemanal,
      minimo: o.minimo,
      maximo: o.maximo,
      estado: estadoVolumen(promedioSemanal, o)
    };
  });

  // ----- Suplementos -----
  const tomasPorSuplemento = new Map(tomas.map((t) => [t.id, t.tomas]));
  const suplementos = inventario.suplementos.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    unidad: s.unidad,
    stock: s.stock,
    dosis: s.dosis,
    frecuencia: s.frecuencia,
    diasRestantes: s.diasRestantes,
    agotado: s.agotado,
    requiereReposicion: s.requiereReposicion,
    tomas: tomasPorSuplemento.get(s.id) ?? 0
  }));

  return {
    usuario: perfil.nombre,
    unidad,
    periodo: { dias, ...periodo, agrupacion },
    totales,
    evolucion,
    frecuencia: frecuenciaPorDiaSemana(porDia),
    ejercicios: ejercicios.map(({ mejorE1rmKg, ...e }) => ({ ...e, mejorE1rm: desdeKg(mejorE1rmKg, unidad) })),
    musculos,
    suplementos
  };
}

// ---------- Exportación CSV ----------

const SI_NO = (valor) => (valor ? 'Sí' : 'No');

async function filasSeries(pool, usuarioId, dias, unidad) {
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('dias', sql.Int, dias)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      ${PERIODO_SQL}
      SELECT CONVERT(CHAR(10), x.FechaLocal, 23) AS fecha, CONVERT(CHAR(5), x.FechaLocal, 108) AS hora,
             r.Nombre AS rutina, e.Nombre AS ejercicio, s.NumeroSerie AS numero,
             s.PesoKg AS pesoKg, s.Reps AS reps, s.RIR AS rir, s.RPE AS rpe,
             s.EsCalentamiento AS esCalentamiento, s.EsEfectiva AS esEfectiva, s.E1RM AS e1rmKg
      FROM Sesiones se
      CROSS APPLY (SELECT CAST(se.FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATETIME2(0)) AS FechaLocal) x
      JOIN Series s     ON s.SesionId = se.SesionId
      JOIN Ejercicios e ON e.EjercicioId = s.EjercicioId
      LEFT JOIN Rutinas r ON r.RutinaId = se.RutinaId
      WHERE se.UsuarioId = @usuarioId
        AND se.FechaFin IS NOT NULL
        AND se.FechaInicio >= DATEADD(DAY, -@dias - 2, SYSUTCDATETIME())
        AND CAST(x.FechaLocal AS DATE) >= @inicio
      ORDER BY se.FechaInicio, s.FechaRegistro, s.NumeroSerie
    `);

  return result.recordset.map((f) => ({
    ...f,
    rutina: f.rutina ?? 'Sesión libre',
    peso: desdeKg(f.pesoKg, unidad),
    unidad,
    rpe: f.rpe === null ? null : Number(f.rpe),
    esCalentamiento: SI_NO(f.esCalentamiento),
    esEfectiva: SI_NO(f.esEfectiva),
    e1rm: desdeKg(f.e1rmKg, unidad)
  }));
}

async function filasSesiones(pool, usuarioId, dias, unidad) {
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('dias', sql.Int, dias)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      ${PERIODO_SQL}
      SELECT CONVERT(CHAR(10), x.FechaLocal, 23) AS fecha, CONVERT(CHAR(5), x.FechaLocal, 108) AS hora,
             r.Nombre AS rutina,
             DATEDIFF(MINUTE, se.FechaInicio, se.FechaFin) AS minutos,
             se.FatigaPercibida AS fatiga,
             COUNT(s.SerieId) AS series,
             SUM(CASE WHEN s.EsEfectiva = 1 THEN 1 ELSE 0 END) AS seriesEfectivas,
             ISNULL(SUM(CASE WHEN s.EsCalentamiento = 0 THEN s.PesoKg * s.Reps ELSE 0 END), 0) AS volumenKg
      FROM Sesiones se
      CROSS APPLY (SELECT CAST(se.FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATETIME2(0)) AS FechaLocal) x
      LEFT JOIN Rutinas r ON r.RutinaId = se.RutinaId
      LEFT JOIN Series s  ON s.SesionId = se.SesionId
      WHERE se.UsuarioId = @usuarioId
        AND se.FechaFin IS NOT NULL
        AND se.FechaInicio >= DATEADD(DAY, -@dias - 2, SYSUTCDATETIME())
        AND CAST(x.FechaLocal AS DATE) >= @inicio
      GROUP BY se.SesionId, se.FechaInicio, se.FechaFin, x.FechaLocal, r.Nombre, se.FatigaPercibida
      ORDER BY se.FechaInicio
    `);

  return result.recordset.map((f) => ({
    ...f,
    rutina: f.rutina ?? 'Sesión libre',
    volumen: desdeKg(f.volumenKg, unidad),
    unidad
  }));
}

async function filasSuplementos(pool, usuarioId, dias) {
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('dias', sql.Int, dias)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      ${PERIODO_SQL}
      SELECT CONVERT(CHAR(10), x.FechaLocal, 23) AS fecha, CONVERT(CHAR(5), x.FechaLocal, 108) AS hora,
             su.Nombre AS suplemento, m.Tipo AS tipo, m.Cantidad AS cantidad,
             su.Unidad AS unidad, m.Nota AS nota
      FROM MovimientosInventario m
      CROSS APPLY (SELECT CAST(m.Fecha AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATETIME2(0)) AS FechaLocal) x
      JOIN Suplementos su ON su.SuplementoId = m.SuplementoId
      WHERE su.UsuarioId = @usuarioId
        AND m.Fecha >= DATEADD(DAY, -@dias - 2, SYSUTCDATETIME())
        AND CAST(x.FechaLocal AS DATE) >= @inicio
      ORDER BY m.Fecha, m.MovimientoId
    `);

  return result.recordset.map((f) => ({ ...f, cantidad: Number(f.cantidad) }));
}

const EXPORTACIONES = {
  series: {
    obtener: filasSeries,
    columnas: [
      { titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Hora', campo: 'hora' },
      { titulo: 'Rutina', campo: 'rutina' }, { titulo: 'Ejercicio', campo: 'ejercicio' },
      { titulo: 'Serie', campo: 'numero' }, { titulo: 'Peso', campo: 'peso' },
      { titulo: 'Unidad', campo: 'unidad' }, { titulo: 'Reps', campo: 'reps' },
      { titulo: 'RIR', campo: 'rir' }, { titulo: 'RPE', campo: 'rpe' },
      { titulo: 'Calentamiento', campo: 'esCalentamiento' }, { titulo: 'Efectiva', campo: 'esEfectiva' },
      { titulo: '1RM estimado', campo: 'e1rm' }
    ]
  },
  sesiones: {
    obtener: filasSesiones,
    columnas: [
      { titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Hora', campo: 'hora' },
      { titulo: 'Rutina', campo: 'rutina' }, { titulo: 'Duración (min)', campo: 'minutos' },
      { titulo: 'Fatiga (1-10)', campo: 'fatiga' }, { titulo: 'Series', campo: 'series' },
      { titulo: 'Series efectivas', campo: 'seriesEfectivas' }, { titulo: 'Volumen', campo: 'volumen' },
      { titulo: 'Unidad', campo: 'unidad' }
    ]
  },
  suplementos: {
    obtener: filasSuplementos,
    columnas: [
      { titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Hora', campo: 'hora' },
      { titulo: 'Suplemento', campo: 'suplemento' }, { titulo: 'Movimiento', campo: 'tipo' },
      { titulo: 'Cantidad', campo: 'cantidad' }, { titulo: 'Unidad', campo: 'unidad' },
      { titulo: 'Nota', campo: 'nota' }
    ]
  }
};

export const TIPOS_CSV = Object.keys(EXPORTACIONES);

export async function exportarCsv(usuarioId, dias, tipo) {
  const { obtener, columnas } = EXPORTACIONES[tipo];
  const pool = await getPool();
  const unidad = (await obtenerPerfil(usuarioId)).unidadPeso;
  const filas = await obtener(pool, usuarioId, dias, unidad);
  return aCsv(columnas, filas);
}