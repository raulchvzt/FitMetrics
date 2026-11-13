import * as authService from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';
import { UNIDADES } from '../utils/unidades.js';

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
  const usuario = await authService.obtenerPerfil(req.usuario.id);
  res.json(usuario);
}

export async function actualizarPerfil(req, res) {
  const { unidadPeso, pesoCorporal } = req.body ?? {};

  if (unidadPeso === undefined && pesoCorporal === undefined) {
    throw new HttpError(400, 'Envía unidadPeso, pesoCorporal o ambos');
  }
  if (unidadPeso !== undefined && !UNIDADES.includes(unidadPeso)) {
    throw new HttpError(400, 'La unidad debe ser "kg" o "lb"');
  }
  if (pesoCorporal !== undefined && pesoCorporal !== null &&
      (typeof pesoCorporal !== 'number' || pesoCorporal < 20 || pesoCorporal > 700)) {
    throw new HttpError(400, 'El peso corporal no es válido');
  }

  res.json(await authService.actualizarPerfil(req.usuario.id, { unidadPeso, pesoCorporal }));
}