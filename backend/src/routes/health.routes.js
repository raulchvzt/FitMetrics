import { Router } from 'express';
import { getPool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
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