import { Router } from 'express';
import { getPool } from '../config/db.js';

const router = Router();

// Revisión ligera: solo dice que la API está encendida.
// Render la consulta seguido; si tocara la base, nunca la dejaría pausarse
// y se gastaría el tiempo gratis de Azure SQL.
router.get('/', (req, res) => {
  res.json({ estado: 'ok' });
});

// Revisión completa: también prueba la base de datos (puede tardar si estaba en pausa)
router.get('/db', async (req, res, next) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    // No se expone el nombre de la base ni la hora del servidor: solo si responde
    res.json({ estado: 'ok', baseDatos: 'conectada' });
  } catch (err) {
    next(err);
  }
});

export default router;
