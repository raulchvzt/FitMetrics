import { Router } from 'express';
import { getPool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT DB_NAME() AS baseDatos, SYSDATETIME() AS horaServidor');

    res.json({ estado: 'ok', ...result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

export default router;