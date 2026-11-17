import * as ejerciciosService from '../services/ejercicios.service.js';
import { HttpError } from '../utils/httpError.js';
import { esImagenValida } from '../utils/imagenes.js';

export const EQUIPOS = ['Barra', 'Mancuerna', 'Máquina', 'Polea', 'Peso corporal', 'Otro'];
// Saltos de carga que tienen sentido en un gimnasio (en kg)
export const INCREMENTOS = [0.5, 1, 1.25, 2, 2.5, 5];
const MAX_SECUNDARIOS = 3;

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'ID de ejercicio inválido');
  }
  return id;
}

export function validarEjercicio(body) {
  const { nombre, equipo, incrementoKg = 2.5, principal, secundarios = [] } = body ?? {};

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
    throw new HttpError(400, 'El nombre es obligatorio (máximo 100 caracteres)');
  }
  if (!EQUIPOS.includes(equipo)) {
    throw new HttpError(400, `El equipo debe ser uno de: ${EQUIPOS.join(', ')}`);
  }
  if (!INCREMENTOS.includes(incrementoKg)) {
    throw new HttpError(400, `El incremento debe ser uno de: ${INCREMENTOS.join(', ')} kg`);
  }
  if (!Number.isInteger(principal) || principal <= 0) {
    throw new HttpError(400, 'Elige el músculo principal');
  }
  if (!Array.isArray(secundarios) || secundarios.length > MAX_SECUNDARIOS ||
      secundarios.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new HttpError(400, `Puedes elegir hasta ${MAX_SECUNDARIOS} músculos secundarios`);
  }
  if (secundarios.includes(principal) || new Set(secundarios).size !== secundarios.length) {
    throw new HttpError(400, 'Un músculo no puede repetirse ni ser principal y secundario a la vez');
  }

  return {
    nombre: nombre.trim().replace(/\s+/g, ' '),
    // Si trabaja más de un músculo, es compuesto (varias articulaciones)
    tipo: secundarios.length > 0 ? 'Compuesto' : 'Aislamiento',
    equipo,
    incrementoKg,
    musculos: [
      { grupoMuscularId: principal, factor: 1 },
      ...secundarios.map((id) => ({ grupoMuscularId: id, factor: 0.5 }))
    ]
  };
}

export async function listar(req, res) {
  res.json(await ejerciciosService.listar(req.usuario.id));
}

export async function grupos(req, res) {
  res.json(await ejerciciosService.gruposMusculares());
}

export async function crear(req, res) {
  const datos = validarEjercicio(req.body);
  res.status(201).json(await ejerciciosService.crear(req.usuario.id, datos));
}

export async function actualizar(req, res) {
  const datos = validarEjercicio(req.body);
  res.json(await ejerciciosService.actualizar(req.usuario.id, leerId(req), datos));
}

export async function eliminar(req, res) {
  await ejerciciosService.eliminar(req.usuario.id, leerId(req));
  res.status(204).end();
}

export async function actualizarFoto(req, res) {
  const { foto } = req.body ?? {};
  if (!esImagenValida(foto)) {
    throw new HttpError(400, 'La foto debe ser una imagen JPEG, PNG o WebP de máximo 290 KB');
  }
  res.json(await ejerciciosService.actualizarFoto(req.usuario.id, leerId(req), foto));
}

export async function quitarFoto(req, res) {
  res.json(await ejerciciosService.actualizarFoto(req.usuario.id, leerId(req), null));
}
