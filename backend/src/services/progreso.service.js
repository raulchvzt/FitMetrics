import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { desdeKg } from '../utils/unidades.js';
import { obtenerUnidad } from './auth.service.js';
import { estadoDelCuerpo, HORAS_MAXIMAS } from '../utils/recuperacion.js';

const ZONA_HORARIA = process.env.ZONA_HORARIA || 'Central Standard Time (Mexico)';

// Rango de series efectivas por semana cuando el usuario no ha configurado el suyo
export const RANGO_POR_DEFECTO = { minimo: 10, maximo: 20 };

export async function volumenSemanal(usuarioId, semana) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('semana', sql.VarChar(10), semana)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .input('minimoDefecto', sql.TinyInt, RANGO_POR_DEFECTO.minimo)
    .input('maximoDefecto', sql.TinyInt, RANGO_POR_DEFECTO.maximo)
    .query(`
      DECLARE @hoy    DATE = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE);
      DECLARE @base   DATE = ISNULL(TRY_CAST(@semana AS DATE), @hoy);
      DECLARE @inicio DATE = DATEADD(DAY, -(DATEDIFF(DAY, '19000101', @base) % 7), @base);
      DECLARE @actual DATE = DATEADD(DAY, -(DATEDIFF(DAY, '19000101', @hoy) % 7), @hoy);

      WITH SeriesLocales AS (
        SELECT s.EjercicioId,
               CAST(se.FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE) AS Dia
        FROM Series s
        JOIN Sesiones se ON se.SesionId = s.SesionId
        WHERE se.UsuarioId = @usuarioId
          AND s.EsEfectiva = 1
          AND se.FechaInicio >= DATEADD(DAY, -8, @inicio)
          AND se.FechaInicio <  DATEADD(DAY, 8, @inicio)
      )
      SELECT gm.GrupoMuscularId AS id,
             gm.Nombre AS musculo,
             ISNULL(SUM(CASE WHEN sl.Dia >= @inicio THEN em.Factor END), 0) AS series,
             ISNULL(SUM(CASE WHEN sl.Dia <  @inicio THEN em.Factor END), 0) AS seriesAnterior,
             ISNULL(ov.SeriesMin, @minimoDefecto) AS minimo,
             ISNULL(ov.SeriesMax, @maximoDefecto) AS maximo
      FROM GruposMusculares gm
      LEFT JOIN EjercicioMusculos em ON em.GrupoMuscularId = gm.GrupoMuscularId
      LEFT JOIN SeriesLocales sl ON sl.EjercicioId = em.EjercicioId
                                AND sl.Dia >= DATEADD(DAY, -7, @inicio)
                                AND sl.Dia <= DATEADD(DAY, 6, @inicio)
      LEFT JOIN ObjetivosVolumen ov ON ov.UsuarioId = @usuarioId
                                   AND ov.GrupoMuscularId = gm.GrupoMuscularId
      GROUP BY gm.GrupoMuscularId, gm.Nombre, ov.SeriesMin, ov.SeriesMax
      ORDER BY gm.GrupoMuscularId;

      SELECT CONVERT(CHAR(10), @inicio, 23) AS inicio,
             CONVERT(CHAR(10), DATEADD(DAY, 6, @inicio), 23) AS fin,
             CAST(CASE WHEN @inicio >= @actual THEN 1 ELSE 0 END AS BIT) AS esSemanaActual;
    `);

  const [musculos, [semanaInfo]] = result.recordsets;
  return { ...semanaInfo, musculos };
}
export async function ejerciciosEntrenados(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT e.EjercicioId AS id, e.Nombre AS nombre,
             COUNT(DISTINCT se.SesionId) AS sesiones
      FROM Series s
      JOIN Sesiones se  ON se.SesionId = s.SesionId
      JOIN Ejercicios e ON e.EjercicioId = s.EjercicioId
      WHERE se.UsuarioId = @usuarioId
        AND se.FechaFin IS NOT NULL
        AND s.EsCalentamiento = 0
        AND s.PesoKg > 0
      GROUP BY e.EjercicioId, e.Nombre
      ORDER BY MAX(se.FechaInicio) DESC
    `);
  return result.recordset;
}

export async function evolucionFuerza(usuarioId, ejercicioId, dias) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('ejercicioId', sql.Int, ejercicioId)
    .input('dias', sql.Int, dias)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      SELECT Nombre AS nombre FROM Ejercicios
      WHERE EjercicioId = @ejercicioId AND (UsuarioId IS NULL OR UsuarioId = @usuarioId);

      WITH Ordenadas AS (
        SELECT se.SesionId, se.FechaInicio, s.PesoKg, s.Reps, s.E1RM,
               ROW_NUMBER() OVER (
                 PARTITION BY se.SesionId
                 ORDER BY s.E1RM DESC, s.PesoKg DESC
               ) AS Puesto
        FROM Series s
        JOIN Sesiones se ON se.SesionId = s.SesionId
        WHERE se.UsuarioId = @usuarioId
          AND se.FechaFin IS NOT NULL
          AND s.EsCalentamiento = 0
          AND s.EjercicioId = @ejercicioId
          AND s.PesoKg > 0
          AND (@dias = 0 OR se.FechaInicio >= DATEADD(DAY, -@dias, SYSUTCDATETIME()))
      )
      SELECT SesionId AS sesionId,
             CONVERT(CHAR(10), CAST(FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE), 23) AS fecha,
             PesoKg, Reps AS reps, E1RM
      FROM Ordenadas
      WHERE Puesto = 1
      ORDER BY FechaInicio;
    `);

  const [[ejercicio], sesiones] = result.recordsets;
  if (!ejercicio) return null;

  const unidad = await obtenerUnidad(usuarioId);
  const puntos = sesiones.map((s) => ({
    sesionId: s.sesionId,
    fecha: s.fecha,
    peso: desdeKg(s.PesoKg, unidad),
    reps: s.reps,
    e1rm: desdeKg(s.E1RM, unidad)
  }));

  return { ejercicioId, nombre: ejercicio.nombre, unidad, dias, puntos };
}
export async function obtenerObjetivos(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('minimoDefecto', sql.TinyInt, RANGO_POR_DEFECTO.minimo)
    .input('maximoDefecto', sql.TinyInt, RANGO_POR_DEFECTO.maximo)
    .query(`
      SELECT gm.GrupoMuscularId AS grupoMuscularId,
             gm.Nombre AS musculo,
             ISNULL(ov.SeriesMin, @minimoDefecto) AS minimo,
             ISNULL(ov.SeriesMax, @maximoDefecto) AS maximo,
             CAST(CASE WHEN ov.UsuarioId IS NULL THEN 0 ELSE 1 END AS BIT) AS personalizado
      FROM GruposMusculares gm
      LEFT JOIN ObjetivosVolumen ov ON ov.UsuarioId = @usuarioId
                                   AND ov.GrupoMuscularId = gm.GrupoMuscularId
      ORDER BY gm.GrupoMuscularId
    `);
  return { porDefecto: RANGO_POR_DEFECTO, musculos: result.recordset };
}

export async function guardarObjetivos(usuarioId, objetivos) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    for (const { grupoMuscularId, minimo, maximo } of objetivos) {
      const esDefecto = minimo === RANGO_POR_DEFECTO.minimo && maximo === RANGO_POR_DEFECTO.maximo;

      const result = await new sql.Request(transaction)
        .input('usuarioId', sql.Int, usuarioId)
        .input('grupoMuscularId', sql.Int, grupoMuscularId)
        .input('minimo', sql.TinyInt, minimo)
        .input('maximo', sql.TinyInt, maximo)
        .input('esDefecto', sql.Bit, esDefecto)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM GruposMusculares WHERE GrupoMuscularId = @grupoMuscularId)
            SELECT 0 AS existe;
          ELSE
          BEGIN
            IF @esDefecto = 1
              DELETE FROM ObjetivosVolumen
              WHERE UsuarioId = @usuarioId AND GrupoMuscularId = @grupoMuscularId;
            ELSE
              MERGE ObjetivosVolumen AS destino
              USING (SELECT @usuarioId AS UsuarioId, @grupoMuscularId AS GrupoMuscularId) AS origen
                 ON destino.UsuarioId = origen.UsuarioId
                AND destino.GrupoMuscularId = origen.GrupoMuscularId
              WHEN MATCHED THEN
                UPDATE SET SeriesMin = @minimo, SeriesMax = @maximo
              WHEN NOT MATCHED THEN
                INSERT (UsuarioId, GrupoMuscularId, SeriesMin, SeriesMax)
                VALUES (@usuarioId, @grupoMuscularId, @minimo, @maximo);
            SELECT 1 AS existe;
          END
        `);

      if (!result.recordset[0].existe) {
        throw new HttpError(400, `El grupo muscular ${grupoMuscularId} no existe`);
      }
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return obtenerObjetivos(usuarioId);
}

export async function restablecerObjetivos(usuarioId) {
  const pool = await getPool();
  await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query('DELETE FROM ObjetivosVolumen WHERE UsuarioId = @usuarioId');
  return obtenerObjetivos(usuarioId);
}
// Recuperación y volumen semanal de cada músculo (pantalla "Tu cuerpo")
export async function estadoCuerpo(usuarioId) {
  const { musculos: volumen } = await volumenSemanal(usuarioId, null);

  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('horas', sql.Int, HORAS_MAXIMAS)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      DECLARE @ahora DATETIME2 = SYSUTCDATETIME();
      DECLARE @hoy   DATE = CAST(@ahora AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE);

      -- Series efectivas recientes, con hace cuántas horas se hicieron
      SELECT em.GrupoMuscularId AS grupoMuscularId,
             em.Factor AS factor,
             s.RIR AS rir,
             DATEDIFF(MINUTE, se.FechaInicio, @ahora) / 60.0 AS horas
      FROM Series s
      JOIN Sesiones se ON se.SesionId = s.SesionId
      JOIN EjercicioMusculos em ON em.EjercicioId = s.EjercicioId
      WHERE se.UsuarioId = @usuarioId
        AND s.EsEfectiva = 1
        AND se.FechaInicio >= DATEADD(HOUR, -@horas, @ahora);

      -- Última sesión de cada músculo (últimos 60 días)
      WITH PorSesion AS (
        SELECT em.GrupoMuscularId,
               se.FechaInicio,
               SUM(em.Factor) AS Series,
               ROW_NUMBER() OVER (PARTITION BY em.GrupoMuscularId ORDER BY se.FechaInicio DESC) AS Puesto
        FROM Series s
        JOIN Sesiones se ON se.SesionId = s.SesionId
        JOIN EjercicioMusculos em ON em.EjercicioId = s.EjercicioId
        WHERE se.UsuarioId = @usuarioId
          AND s.EsEfectiva = 1
          AND se.FechaInicio >= DATEADD(DAY, -60, @ahora)
        GROUP BY em.GrupoMuscularId, se.SesionId, se.FechaInicio
      )
      SELECT GrupoMuscularId AS grupoMuscularId,
             DATEDIFF(DAY, CAST(FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE), @hoy) AS dias,
             Series AS series
      FROM PorSesion
      WHERE Puesto = 1;
    `);

  const [recientes, ultimas] = result.recordsets;
  return { musculos: estadoDelCuerpo({ volumen, recientes, ultimas }) };
}
