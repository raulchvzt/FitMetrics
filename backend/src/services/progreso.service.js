import { getPool, sql } from '../config/db.js';

const ZONA_HORARIA = process.env.ZONA_HORARIA || 'Central Standard Time (Mexico)';

export async function volumenSemanal(usuarioId, semana) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('semana', sql.VarChar(10), semana)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
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
             ISNULL(ov.SeriesMin, 10) AS minimo,
             ISNULL(ov.SeriesMax, 20) AS maximo
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