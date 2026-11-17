import * as sesionesService from '../services/sesiones.service.js';
import { HttpError } from '../utils/httpError.js';
import { UNIDADES } from '../utils/unidades.js';

function leerEntero(valor, nombre) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `${nombre} inválido`);
  }
  return n;
}

function validarSerie(body) {
  const { ejercicioId, peso, unidad, reps, rir = null, esCalentamiento = false } = body ?? {};

  if (!Number.isInteger(ejercicioId) || ejercicioId <= 0) {
    throw new HttpError(400, 'ejercicioId inválido');
  }
  if (typeof peso !== 'number' || !Number.isFinite(peso) || peso < 0) {
    throw new HttpError(400, 'El peso debe ser un número mayor o igual a 0');
  }
  if (unidad !== undefined && !UNIDADES.includes(unidad)) {
    throw new HttpError(400, 'La unidad debe ser "kg" o "lb"');
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    throw new HttpError(400, 'Las repeticiones deben ser un entero entre 1 y 100');
  }
  if (rir !== null && (!Number.isInteger(rir) || rir < 0 || rir > 10)) {
    throw new HttpError(400, 'El RIR debe ser un entero entre 0 y 10');
  }
  if (typeof esCalentamiento !== 'boolean') {
    throw new HttpError(400, 'esCalentamiento debe ser true o false');
  }

  return {
    ejercicioId,
    peso,
    unidad,
    reps,
    rir: esCalentamiento ? null : rir,
    esCalentamiento
  };
}

export async function historial(req, res) {
  const pagina = req.query.pagina ? leerEntero(req.query.pagina, 'Página') : 1;
  const limite = Math.min(req.query.limite ? leerEntero(req.query.limite, 'Límite') : 20, 50);
  res.json(await sesionesService.listarHistorial(req.usuario.id, { pagina, limite }));
}

export async function activa(req, res) {
  const sesion = await sesionesService.obtenerSesionActiva(req.usuario.id);
  if (!sesion) return res.status(204).end();
  res.json(sesion);
}

export async function detalle(req, res) {
  const sesionId = leerEntero(req.params.id, 'ID de sesión');
  res.json(await sesionesService.obtenerDetalle(req.usuario.id, sesionId));
}

export async function iniciar(req, res) {
  const { rutinaId = null } = req.body ?? {};
  if (rutinaId !== null) leerEntero(rutinaId, 'ID de rutina');

  const sesion = await sesionesService.iniciarSesion(req.usuario.id, { rutinaId });
  res.status(201).json(sesion);
}

export async function agregarSerie(req, res) {
  const sesionId = leerEntero(req.params.id, 'ID de sesión');
  const serie = validarSerie(req.body);
  res.status(201).json(await sesionesService.registrarSerie(req.usuario.id, sesionId, serie));
}

export async function quitarSerie(req, res) {
  const sesionId = leerEntero(req.params.id, 'ID de sesión');
  const serieId = leerEntero(req.params.serieId, 'ID de serie');
  await sesionesService.eliminarSerie(req.usuario.id, sesionId, serieId);
  res.status(204).end();
}

export async function finalizar(req, res) {
  const sesionId = leerEntero(req.params.id, 'ID de sesión');
  const { fatigaPercibida = null } = req.body ?? {};

  if (fatigaPercibida !== null &&
      (!Number.isInteger(fatigaPercibida) || fatigaPercibida < 1 || fatigaPercibida > 10)) {
    throw new HttpError(400, 'La fatiga percibida debe ser un entero entre 1 y 10');
  }

  res.json(await sesionesService.finalizarSesion(req.usuario.id, sesionId, { fatigaPercibida }));
}

export async function cancelar(req, res) {
  const sesionId = leerEntero(req.params.id, 'ID de sesión');
  await sesionesService.cancelarSesion(req.usuario.id, sesionId);
  res.status(204).end();
}