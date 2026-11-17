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
const LIMITE_SERIES = 40;

function validarObjetivos(body) {
  const { objetivos } = body ?? {};

  if (!Array.isArray(objetivos) || objetivos.length === 0 || objetivos.length > 50) {
    throw new HttpError(400, 'Envía la lista de objetivos a guardar');
  }

  const vistos = new Set();
  return objetivos.map((o, i) => {
    const pos = `Objetivo ${i + 1}`;
    const { grupoMuscularId, minimo, maximo } = o ?? {};

    if (!Number.isInteger(grupoMuscularId) || grupoMuscularId <= 0) {
      throw new HttpError(400, `${pos}: grupoMuscularId inválido`);
    }
    if (vistos.has(grupoMuscularId)) {
      throw new HttpError(400, `${pos}: el grupo muscular ${grupoMuscularId} está repetido`);
    }
    vistos.add(grupoMuscularId);

    if (!Number.isInteger(minimo) || minimo < 0 || minimo > LIMITE_SERIES) {
      throw new HttpError(400, `${pos}: el mínimo debe ser un entero de 0 a ${LIMITE_SERIES}`);
    }
    if (!Number.isInteger(maximo) || maximo < 1 || maximo > LIMITE_SERIES) {
      throw new HttpError(400, `${pos}: el máximo debe ser un entero de 1 a ${LIMITE_SERIES}`);
    }
    if (maximo < minimo) {
      throw new HttpError(400, `${pos}: el máximo no puede ser menor que el mínimo`);
    }

    return { grupoMuscularId, minimo, maximo };
  });
}

export async function objetivos(req, res) {
  res.json(await progresoService.obtenerObjetivos(req.usuario.id));
}

export async function guardarObjetivos(req, res) {
  const datos = validarObjetivos(req.body);
  res.json(await progresoService.guardarObjetivos(req.usuario.id, datos));
}

export async function restablecerObjetivos(req, res) {
  res.json(await progresoService.restablecerObjetivos(req.usuario.id));
}