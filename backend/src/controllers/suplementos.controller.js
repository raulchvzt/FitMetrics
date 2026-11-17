import * as suplementosService from '../services/suplementos.service.js';
import { HttpError } from '../utils/httpError.js';

export const UNIDADES_SUPLEMENTO = ['g', 'scoop', 'cápsula', 'tableta', 'ml'];
const FRECUENCIAS = ['Diario', 'DiaEntreno'];
const MOMENTOS = ['Cualquiera', 'AntesEntrenar', 'DespuesEntrenar'];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAXIMO = 100000;

const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);
const dosDecimales = (valor) => Math.round(valor * 100) / 100;

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID de suplemento inválido');
  return id;
}

function leerCantidad(valor, nombre, { permitirCero = false } = {}) {
  const valido = esNumero(valor) && (permitirCero ? valor >= 0 : valor > 0) && valor <= MAXIMO;
  if (!valido) {
    throw new HttpError(400, `${nombre} debe ser un número ${permitirCero ? 'de 0' : 'mayor a 0'} hasta ${MAXIMO}`);
  }
  return dosDecimales(valor);
}

function validarSuplemento(body, { conStock }) {
  const {
    nombre, unidad, dosis, frecuencia = 'Diario', momento = 'Cualquiera',
    horaRecordatorio = null, presentacion = null, diasAlerta = 7, stock = 0
  } = body ?? {};

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
    throw new HttpError(400, 'El nombre es obligatorio (máximo 100 caracteres)');
  }
  if (!UNIDADES_SUPLEMENTO.includes(unidad)) {
    throw new HttpError(400, `La unidad debe ser una de: ${UNIDADES_SUPLEMENTO.join(', ')}`);
  }
  if (!FRECUENCIAS.includes(frecuencia)) {
    throw new HttpError(400, 'La frecuencia debe ser "Diario" o "DiaEntreno"');
  }
  if (!MOMENTOS.includes(momento)) {
    throw new HttpError(400, 'El momento debe ser "Cualquiera", "AntesEntrenar" o "DespuesEntrenar"');
  }
  if (horaRecordatorio !== null && !HORA.test(horaRecordatorio)) {
    throw new HttpError(400, 'La hora del recordatorio debe tener formato HH:MM, por ejemplo 09:00');
  }
  if (!Number.isInteger(diasAlerta) || diasAlerta < 0 || diasAlerta > 60) {
    throw new HttpError(400, 'Los días de alerta deben ser un entero de 0 a 60');
  }

  return {
    nombre: nombre.trim(),
    unidad,
    dosis: leerCantidad(dosis, 'La dosis'),
    frecuencia,
    momento,
    horaRecordatorio,
    presentacion: presentacion === null ? null : leerCantidad(presentacion, 'La presentación'),
    diasAlerta,
    ...(conStock && { stock: leerCantidad(stock, 'El stock inicial', { permitirCero: true }) })
  };
}

export async function listar(req, res) {
  res.json(await suplementosService.listar(req.usuario.id));
}

export async function obtener(req, res) {
  res.json(await suplementosService.obtener(req.usuario.id, leerId(req)));
}

export async function movimientos(req, res) {
  res.json(await suplementosService.movimientos(req.usuario.id, leerId(req)));
}

export async function crear(req, res) {
  const datos = validarSuplemento(req.body, { conStock: true });
  res.status(201).json(await suplementosService.crear(req.usuario.id, datos));
}

export async function actualizar(req, res) {
  const datos = validarSuplemento(req.body, { conStock: false });
  res.json(await suplementosService.actualizar(req.usuario.id, leerId(req), datos));
}

export async function eliminar(req, res) {
  await suplementosService.desactivar(req.usuario.id, leerId(req));
  res.status(204).end();
}

export async function tomar(req, res) {
  res.status(201).json(await suplementosService.registrarToma(req.usuario.id, leerId(req)));
}

export async function deshacerToma(req, res) {
  res.json(await suplementosService.deshacerToma(req.usuario.id, leerId(req)));
}

export async function comprar(req, res) {
  const cantidad = leerCantidad(req.body?.cantidad, 'La cantidad comprada');
  res.status(201).json(await suplementosService.registrarCompra(req.usuario.id, leerId(req), cantidad));
}

export async function ajustar(req, res) {
  const stock = leerCantidad(req.body?.stock, 'El stock', { permitirCero: true });
  res.json(await suplementosService.ajustarStock(req.usuario.id, leerId(req), stock));
}