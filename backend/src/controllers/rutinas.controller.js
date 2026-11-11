import * as rutinasService from '../services/rutinas.service.js';
import { HttpError } from '../utils/httpError.js';

function enRango(valor, min, max) {
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'ID de rutina inválido');
  }
  return id;
}

function validarRutina(body) {
  const { nombre, descripcion, ejercicios } = body ?? {};

  if (!nombre?.trim() || nombre.trim().length > 100) {
    throw new HttpError(400, 'El nombre es obligatorio (máximo 100 caracteres)');
  }
  if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
    throw new HttpError(400, 'La rutina debe tener al menos un ejercicio');
  }
  if (ejercicios.length > 20) {
    throw new HttpError(400, 'Una rutina puede tener máximo 20 ejercicios');
  }

  const ejerciciosValidos = ejercicios.map((ej, i) => {
    const pos = `Ejercicio ${i + 1}`;
    const datos = {
      ejercicioId: ej.ejercicioId,
      series:      ej.series      ?? 3,
      repsMin:     ej.repsMin     ?? 8,
      repsMax:     ej.repsMax     ?? 12,
      rir:         ej.rir         ?? 2,
      descansoSeg: ej.descansoSeg ?? 120
    };

    if (!enRango(datos.ejercicioId, 1, 2147483647)) throw new HttpError(400, `${pos}: ejercicioId inválido`);
    if (!enRango(datos.series, 1, 10))        throw new HttpError(400, `${pos}: las series deben ser de 1 a 10`);
    if (!enRango(datos.repsMin, 1, 50))       throw new HttpError(400, `${pos}: repsMin debe ser de 1 a 50`);
    if (!enRango(datos.repsMax, 1, 50))       throw new HttpError(400, `${pos}: repsMax debe ser de 1 a 50`);
    if (datos.repsMax < datos.repsMin)        throw new HttpError(400, `${pos}: repsMax no puede ser menor que repsMin`);
    if (!enRango(datos.rir, 0, 5))            throw new HttpError(400, `${pos}: el RIR debe ser de 0 a 5`);
    if (!enRango(datos.descansoSeg, 15, 600)) throw new HttpError(400, `${pos}: el descanso debe ser de 15 a 600 segundos`);

    return datos;
  });

  return {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    ejercicios: ejerciciosValidos
  };
}

export async function listar(req, res) {
  res.json(await rutinasService.listarRutinas(req.usuario.id));
}

export async function obtener(req, res) {
  res.json(await rutinasService.obtenerRutina(req.usuario.id, leerId(req)));
}

export async function crear(req, res) {
  const datos = validarRutina(req.body);
  const rutina = await rutinasService.crearRutina(req.usuario.id, datos);
  res.status(201).json(rutina);
}

export async function actualizar(req, res) {
  const datos = validarRutina(req.body);
  const rutina = await rutinasService.actualizarRutina(req.usuario.id, leerId(req), datos);
  res.json(rutina);
}

export async function eliminar(req, res) {
  await rutinasService.desactivarRutina(req.usuario.id, leerId(req));
  res.status(204).end();
}