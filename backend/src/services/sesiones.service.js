import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { aKg, desdeKg } from '../utils/unidades.js';
import { obtenerUnidad } from './auth.service.js';
import { agregarSugerencias } from './sobrecarga.service.js';

// ---------- Ayudantes ----------

async function buscarSesion(usuarioId, sesionId, { debeEstarAbierta = false } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('sesionId', sql.Int, sesionId)
    .query(`
      SELECT s.SesionId AS id, s.RutinaId AS rutinaId, r.Nombre AS rutina,
             s.FechaInicio AS fechaInicio, s.FechaFin AS fechaFin,
             s.FatigaPercibida AS fatigaPercibida, s.Notas AS notas,
             DATEDIFF(SECOND, s.FechaInicio, ISNULL(s.FechaFin, SYSUTCDATETIME())) AS segundosTranscurridos
      FROM Sesiones s
      LEFT JOIN Rutinas r ON r.RutinaId = s.RutinaId
      WHERE s.SesionId = @sesionId AND s.UsuarioId = @usuarioId
    `);

  const sesion = result.recordset[0];
  if (!sesion) {
    throw new HttpError(404, 'Sesión no encontrada');
  }
  if (debeEstarAbierta && sesion.fechaFin) {
    throw new HttpError(409, 'La sesión ya fue finalizada');
  }
  return sesion;
}

function agruparSeriesPorEjercicio(filas, unidad) {
  const ejercicios = [];
  const indice = new Map();

  for (const f of filas) {
    if (!indice.has(f.ejercicioId)) {
      indice.set(f.ejercicioId, ejercicios.length);
      ejercicios.push({ ejercicioId: f.ejercicioId, nombre: f.ejercicio, series: [] });
    }
    ejercicios[indice.get(f.ejercicioId)].series.push({
      id: f.id,
      numero: f.numero,
      peso: desdeKg(f.pesoKg, unidad),
      reps: f.reps,
      rir: f.rir,
      rpe: f.rpe,
      esCalentamiento: f.esCalentamiento,
      esEfectiva: f.esEfectiva,
      e1rm: desdeKg(f.e1rm, unidad)
    });
  }
  return ejercicios;
}

// ---------- Lectura ----------

export async function obtenerDetalle(usuarioId, sesionId) {
  const sesion = await buscarSesion(usuarioId, sesionId);
  const pool = await getPool();

  const series = await pool.request()
    .input('sesionId', sql.Int, sesionId)
    .query(`
      SELECT se.SerieId AS id, se.EjercicioId AS ejercicioId, e.Nombre AS ejercicio,
             se.NumeroSerie AS numero, se.PesoKg AS pesoKg, se.Reps AS reps,
             se.RIR AS rir, se.RPE AS rpe, se.EsCalentamiento AS esCalentamiento,
             se.EsEfectiva AS esEfectiva, se.E1RM AS e1rm
      FROM Series se
      JOIN Ejercicios e ON e.EjercicioId = se.EjercicioId
      WHERE se.SesionId = @sesionId
      ORDER BY se.FechaRegistro, se.NumeroSerie
    `);

  let plan = [];
  if (sesion.rutinaId) {
    const result = await pool.request()
      .input('rutinaId', sql.Int, sesion.rutinaId)
      .query(`
        SELECT re.Orden AS orden, re.EjercicioId AS ejercicioId, e.Nombre AS nombre,
               e.Imagen AS imagen, e.Foto AS foto,
               re.SeriesObjetivo AS series, re.RepsMin AS repsMin, re.RepsMax AS repsMax,
               re.RIRObjetivo AS rir, re.DescansoSeg AS descansoSeg,
               e.IncrementoKg AS incrementoKg
        FROM RutinaEjercicios re
        JOIN Ejercicios e ON e.EjercicioId = re.EjercicioId
        WHERE re.RutinaId = @rutinaId
        ORDER BY re.Orden
      `);
    plan = result.recordset;
  }

  const unidad = await obtenerUnidad(usuarioId);
  const enCurso = !sesion.fechaFin;

  if (enCurso) {
    plan = await agregarSugerencias(usuarioId, plan, unidad);
  } else {
    plan = plan.map(({ incrementoKg, ...objetivo }) => objetivo);
  }

  return {
    ...sesion,
    enCurso,
    unidad,
    plan,
    ejercicios: agruparSeriesPorEjercicio(series.recordset, unidad)
  };
}

export async function obtenerSesionActiva(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT TOP 1 SesionId FROM Sesiones
      WHERE UsuarioId = @usuarioId AND FechaFin IS NULL
      ORDER BY FechaInicio DESC
    `);

  const fila = result.recordset[0];
  return fila ? obtenerDetalle(usuarioId, fila.SesionId) : null;
}

export async function listarHistorial(usuarioId, { pagina, limite }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('offset', sql.Int, (pagina - 1) * limite)
    .input('limite', sql.Int, limite)
    .query(`
      SELECT s.SesionId AS id, r.Nombre AS rutina,
             s.FechaInicio AS fechaInicio, s.FechaFin AS fechaFin,
             DATEDIFF(MINUTE, s.FechaInicio, s.FechaFin) AS duracionMin,
             s.FatigaPercibida AS fatigaPercibida,
             COUNT(se.SerieId) AS totalSeries,
             SUM(CASE WHEN se.EsEfectiva = 1 THEN 1 ELSE 0 END) AS seriesEfectivas,
             ISNULL(SUM(CASE WHEN se.EsCalentamiento = 0
                             THEN se.PesoKg * se.Reps ELSE 0 END), 0) AS volumenKg
      FROM Sesiones s
      LEFT JOIN Rutinas r ON r.RutinaId = s.RutinaId
      LEFT JOIN Series se ON se.SesionId = s.SesionId
      WHERE s.UsuarioId = @usuarioId AND s.FechaFin IS NOT NULL
      GROUP BY s.SesionId, r.Nombre, s.FechaInicio, s.FechaFin, s.FatigaPercibida
      ORDER BY s.FechaInicio DESC
      OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
    `);

  const unidad = await obtenerUnidad(usuarioId);

  return result.recordset.map(({ volumenKg, ...sesion }) => ({
    ...sesion,
    volumen: desdeKg(volumenKg, unidad),
    unidad
  }));
}

// ---------- Escritura ----------

export async function iniciarSesion(usuarioId, { rutinaId }) {
  const pool = await getPool();

  const abierta = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query('SELECT 1 FROM Sesiones WHERE UsuarioId = @usuarioId AND FechaFin IS NULL');

  if (abierta.recordset.length > 0) {
    throw new HttpError(409, 'Ya tienes una sesión en curso. Finalízala o cancélala primero');
  }

  if (rutinaId) {
    const rutina = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .input('rutinaId', sql.Int, rutinaId)
      .query('SELECT 1 FROM Rutinas WHERE RutinaId = @rutinaId AND UsuarioId = @usuarioId AND Activa = 1');

    if (rutina.recordset.length === 0) {
      throw new HttpError(404, 'Rutina no encontrada');
    }
  }

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('rutinaId', sql.Int, rutinaId)
    .query(`
      INSERT INTO Sesiones (UsuarioId, RutinaId, BloqueId)
      OUTPUT INSERTED.SesionId AS id
      VALUES (
        @usuarioId,
        @rutinaId,
        (SELECT TOP 1 BloqueId FROM BloquesPeriodizacion
         WHERE UsuarioId = @usuarioId AND Activo = 1
         ORDER BY FechaInicio DESC)
      )
    `);

  return obtenerDetalle(usuarioId, result.recordset[0].id);
}

export async function registrarSerie(usuarioId, sesionId, serie) {
  await buscarSesion(usuarioId, sesionId, { debeEstarAbierta: true });

  const unidadUsuario = await obtenerUnidad(usuarioId);
  const unidadCaptura = serie.unidad ?? unidadUsuario;
  const pesoKg = aKg(serie.peso, unidadCaptura);

  if (pesoKg > 999) {
    throw new HttpError(400, 'El peso no puede superar 999 kg (2202 lb)');
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('sesionId', sql.Int, sesionId)
    .input('usuarioId', sql.Int, usuarioId)
    .input('ejercicioId', sql.Int, serie.ejercicioId)
    .input('pesoKg', sql.Decimal(7, 3), pesoKg)
    .input('reps', sql.TinyInt, serie.reps)
    .input('rir', sql.TinyInt, serie.rir)
    .input('calentamiento', sql.Bit, serie.esCalentamiento)
    .query(`
      INSERT INTO Series (SesionId, EjercicioId, NumeroSerie, PesoKg, Reps, RIR, EsCalentamiento)
      OUTPUT INSERTED.SerieId AS id, INSERTED.EjercicioId AS ejercicioId,
             INSERTED.NumeroSerie AS numero, INSERTED.PesoKg AS pesoKg, INSERTED.Reps AS reps,
             INSERTED.RIR AS rir, INSERTED.RPE AS rpe,
             INSERTED.EsCalentamiento AS esCalentamiento,
             INSERTED.EsEfectiva AS esEfectiva, INSERTED.E1RM AS e1rm
      SELECT @sesionId, e.EjercicioId,
             (SELECT ISNULL(MAX(NumeroSerie), 0) + 1 FROM Series
              WHERE SesionId = @sesionId AND EjercicioId = @ejercicioId),
             @pesoKg, @reps, @rir, @calentamiento
      FROM Ejercicios e
      WHERE e.EjercicioId = @ejercicioId
        AND (e.UsuarioId IS NULL OR e.UsuarioId = @usuarioId)
    `);

  const fila = result.recordset[0];
  if (!fila) {
    throw new HttpError(400, `El ejercicio ${serie.ejercicioId} no existe`);
  }

  const { pesoKg: kg, e1rm, ...resto } = fila;
  return {
    ...resto,
    peso: desdeKg(kg, unidadUsuario),
    e1rm: desdeKg(e1rm, unidadUsuario),
    unidad: unidadUsuario
  };
}

export async function eliminarSerie(usuarioId, sesionId, serieId) {
  await buscarSesion(usuarioId, sesionId, { debeEstarAbierta: true });
  const pool = await getPool();

  const result = await pool.request()
    .input('sesionId', sql.Int, sesionId)
    .input('serieId', sql.Int, serieId)
    .query('DELETE FROM Series WHERE SerieId = @serieId AND SesionId = @sesionId');

  if (result.rowsAffected[0] === 0) {
    throw new HttpError(404, 'Serie no encontrada');
  }
}

export async function finalizarSesion(usuarioId, sesionId, { fatigaPercibida }) {
  await buscarSesion(usuarioId, sesionId, { debeEstarAbierta: true });
  const pool = await getPool();

  const conteo = await pool.request()
    .input('sesionId', sql.Int, sesionId)
    .query('SELECT COUNT(*) AS total FROM Series WHERE SesionId = @sesionId');

  if (conteo.recordset[0].total === 0) {
    throw new HttpError(400, 'Registra al menos una serie antes de finalizar, o cancela la sesión');
  }

  await pool.request()
    .input('SesionId', sql.Int, sesionId)
    .input('FatigaPercibida', sql.TinyInt, fatigaPercibida)
    .execute('sp_FinalizarSesion');

  return obtenerDetalle(usuarioId, sesionId);
}

export async function cancelarSesion(usuarioId, sesionId) {
  await buscarSesion(usuarioId, sesionId, { debeEstarAbierta: true });
  const pool = await getPool();

  await pool.request()
    .input('sesionId', sql.Int, sesionId)
    .query('DELETE FROM Sesiones WHERE SesionId = @sesionId');
}