import * as authService from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';
import { UNIDADES } from '../utils/unidades.js';
import { esImagenValida } from '../utils/imagenes.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registro(req, res) {
  const { nombre, email, password, unidadPeso = 'kg' } = req.body ?? {};

  if (!nombre?.trim() || !email || !password) {
    throw new HttpError(400, 'Nombre, correo y contraseña son obligatorios');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'El correo no tiene un formato válido');
  }
  if (password.length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  if (!UNIDADES.includes(unidadPeso)) {
    throw new HttpError(400, 'La unidad debe ser "kg" o "lb"');
  }

  const resultado = await authService.registrarUsuario({
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    password,
    unidadPeso
  });

  res.status(201).json(resultado);
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    throw new HttpError(400, 'Correo y contraseña son obligatorios');
  }

  const resultado = await authService.iniciarSesion({
    email: email.trim().toLowerCase(),
    password
  });

  res.json(resultado);
}

export async function perfil(req, res) {
  const usuario = await authService.obtenerPerfil(req.usuario.id, { conFoto: true });
  res.json(usuario);
}

export async function actualizarPerfil(req, res) {
  const { nombre, unidadPeso, pesoCorporal } = req.body ?? {};

  if (nombre === undefined && unidadPeso === undefined && pesoCorporal === undefined) {
    throw new HttpError(400, 'Envía nombre, unidadPeso o pesoCorporal');
  }
  if (nombre !== undefined && (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100)) {
    throw new HttpError(400, 'El nombre debe tener entre 1 y 100 caracteres');
  }
  if (unidadPeso !== undefined && !UNIDADES.includes(unidadPeso)) {
    throw new HttpError(400, 'La unidad debe ser "kg" o "lb"');
  }
  if (pesoCorporal !== undefined && pesoCorporal !== null &&
      (typeof pesoCorporal !== 'number' || pesoCorporal < 20 || pesoCorporal > 700)) {
    throw new HttpError(400, 'El peso corporal no es válido');
  }

  res.json(await authService.actualizarPerfil(req.usuario.id, {
    nombre: nombre?.trim(),
    unidadPeso,
    pesoCorporal
  }));
}

export async function actualizarFoto(req, res) {
  const { foto } = req.body ?? {};
  if (!esImagenValida(foto)) {
    throw new HttpError(400, 'La foto debe ser una imagen JPEG, PNG o WebP de máximo 290 KB');
  }
  res.json(await authService.actualizarFoto(req.usuario.id, foto));
}

export async function quitarFoto(req, res) {
  res.json(await authService.actualizarFoto(req.usuario.id, null));
}

export async function cambiarPassword(req, res) {
  const { actual, nueva } = req.body ?? {};

  if (typeof actual !== 'string' || typeof nueva !== 'string' || !actual || !nueva) {
    throw new HttpError(400, 'Escribe tu contraseña actual y la nueva');
  }
  if (nueva.length < 8) {
    throw new HttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
  }
  if (nueva === actual) {
    throw new HttpError(400, 'La nueva contraseña debe ser distinta de la actual');
  }

  await authService.cambiarPassword(req.usuario.id, { actual, nueva });
  res.status(204).end();
}
