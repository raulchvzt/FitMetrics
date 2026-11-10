import { Router } from 'express';
import { getPool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT e.EjercicioId, e.Nombre, e.Tipo, e.Equipo, e.IncrementoKg,
             g.Nombre AS Musculo, em.Factor
      FROM Ejercicios e
      JOIN EjercicioMusculos em ON em.EjercicioId = e.EjercicioId
      JOIN GruposMusculares g   ON g.GrupoMuscularId = em.GrupoMuscularId
      WHERE e.UsuarioId IS NULL
      ORDER BY e.Nombre, em.Factor DESC
    `);

    // SQL devuelve una fila por cada músculo; las agrupamos por ejercicio
    const ejercicios = Object.values(
      result.recordset.reduce((acc, fila) => {
        if (!acc[fila.EjercicioId]) {
          acc[fila.EjercicioId] = {
            id: fila.EjercicioId,
            nombre: fila.Nombre,
            tipo: fila.Tipo,
            equipo: fila.Equipo,
            incrementoKg: fila.IncrementoKg,
            musculos: []
          };
        }
        acc[fila.EjercicioId].musculos.push({
          nombre: fila.Musculo,
          factor: fila.Factor
        });
        return acc;
      }, {})
    );

    res.json(ejercicios);
  } catch (err) {
    next(err);
  }
});

export default router;