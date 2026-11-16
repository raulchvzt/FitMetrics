import * as progresoService from '../services/progreso.service.js';
import { HttpError } from '../utils/httpError.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function volumen(req, res) {
  const { semana } = req.query;

  if (semana !== undefined && (!FECHA.test(semana) || Number.isNaN(Date.parse(semana)))) {
    throw new HttpError(400, 'La semana debe ser una fecha con formato AAAA-MM-DD');
  }

  res.json(await progresoService.volumenSemanal(req.usuario.id, semana ?? null));
}