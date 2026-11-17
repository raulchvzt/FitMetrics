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
const PERIODOS = [30, 90, 180, 365, 0];

export async function ejercicios(req, res) {
  res.json(await progresoService.ejerciciosEntrenados(req.usuario.id));
}

export async function fuerza(req, res) {
  const ejercicioId = Number(req.params.ejercicioId);
  if (!Number.isInteger(ejercicioId) || ejercicioId <= 0) {
    throw new HttpError(400, 'ID de ejercicio inválido');
  }

  const dias = req.query.dias === undefined ? 90 : Number(req.query.dias);
  if (!PERIODOS.includes(dias)) {
    throw new HttpError(400, `El periodo debe ser uno de: ${PERIODOS.join(', ')} días (0 = todo)`);
  }

  const evolucion = await progresoService.evolucionFuerza(req.usuario.id, ejercicioId, dias);
  if (!evolucion) {
    throw new HttpError(404, 'Ejercicio no encontrado');
  }
  res.json(evolucion);
}