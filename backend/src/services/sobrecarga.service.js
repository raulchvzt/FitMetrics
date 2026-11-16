import { getPool, sql } from '../config/db.js';
import { calcularSugerencia } from '../utils/sobrecarga.js';

// Trae las series de trabajo de las últimas 4 sesiones terminadas
// de cada ejercicio del plan, agrupadas por ejercicio y por sesión.
async function historialPorEjercicio(usuarioId, ejercicioIds) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('ejercicios', sql.VarChar(500), ejercicioIds.join(','))
    .query(`
      WITH Trabajo AS (
        SELECT s.EjercicioId, s.SesionId, s.PesoKg, s.Reps, s.RIR, s.E1RM,
               DENSE_RANK() OVER (
                 PARTITION BY s.EjercicioId
                 ORDER BY se.FechaInicio DESC, s.SesionId DESC
               ) AS Orden
        FROM Series s
        JOIN Sesiones se ON se.SesionId = s.SesionId
        WHERE se.UsuarioId = @usuarioId
          AND se.FechaFin IS NOT NULL
          AND s.EsCalentamiento = 0
          AND s.EjercicioId IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ejercicios, ','))
      )
      SELECT EjercicioId, Orden, PesoKg, Reps, RIR, E1RM
      FROM Trabajo
      WHERE Orden <= 4
      ORDER BY EjercicioId, Orden
    `);

  const historial = new Map();
  for (const fila of result.recordset) {
    if (!historial.has(fila.EjercicioId)) historial.set(fila.EjercicioId, []);
    const sesiones = historial.get(fila.EjercicioId);
    if (!sesiones[fila.Orden - 1]) sesiones[fila.Orden - 1] = { series: [] };
    sesiones[fila.Orden - 1].series.push({
      pesoKg: fila.PesoKg,
      reps: fila.Reps,
      rir: fila.RIR,
      e1rm: fila.E1RM
    });
  }
  return historial;
}

export async function agregarSugerencias(usuarioId, plan, unidad) {
  if (plan.length === 0) return plan;

  const historial = await historialPorEjercicio(usuarioId, plan.map((p) => p.ejercicioId));

  return plan.map(({ incrementoKg, ...objetivo }) => ({
    ...objetivo,
    sugerencia: calcularSugerencia({
      objetivo,
      sesiones: historial.get(objetivo.ejercicioId) ?? [],
      unidad,
      incrementoKg
    })
  }));
}