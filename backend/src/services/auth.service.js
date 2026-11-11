import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { aKg, desdeKg } from '../utils/unidades.js';

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

export async function registrarUsuario({ nombre, email, password, unidadPeso = 'kg' }) {
  const pool = await getPool();

  const existe = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT 1 FROM Usuarios WHERE Email = @email');

  if (existe.recordset.length > 0) {
    throw new HttpError(409, 'Ya existe una cuenta con ese correo');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input('nombre', sql.NVarChar(100), nombre)
    .input('email', sql.NVarChar(150), email)
    .input('hash', sql.NVarChar(255), passwordHash)
    .input('unidad', sql.Char(2), unidadPeso)
    .query(`
      INSERT INTO Usuarios (Nombre, Email, PasswordHash, UnidadPeso)
      OUTPUT INSERTED.UsuarioId AS id, INSERTED.Nombre AS nombre, INSERTED.Email AS email
      VALUES (@nombre, @email, @hash, @unidad)
    `);

  const usuario = result.recordset[0];
  return { token: generarToken(usuario), usuario };
}

export async function iniciarSesion({ email, password }) {
  const pool = await getPool();

  const result = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query(`
      SELECT UsuarioId AS id, Nombre AS nombre, Email AS email, PasswordHash, Activo
      FROM Usuarios WHERE Email = @email
    `);

  const fila = result.recordset[0];
  const passwordCorrecta = fila && await bcrypt.compare(password, fila.PasswordHash);

  if (!passwordCorrecta || !fila.Activo) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }

  const usuario = { id: fila.id, nombre: fila.nombre, email: fila.email };
  return { token: generarToken(usuario), usuario };
}

export async function obtenerPerfil(usuarioId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('id', sql.Int, usuarioId)
    .query(`
      SELECT UsuarioId AS id, Nombre AS nombre, Email AS email,
             PesoCorporalKg, UnidadPeso AS unidadPeso,
             FechaRegistro AS fechaRegistro
      FROM Usuarios WHERE UsuarioId = @id AND Activo = 1
    `);

  const fila = result.recordset[0];
  if (!fila) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const { PesoCorporalKg, ...perfil } = fila;
  return { ...perfil, pesoCorporal: desdeKg(PesoCorporalKg, fila.unidadPeso) };
}

export async function obtenerUnidad(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, usuarioId)
    .query('SELECT UnidadPeso FROM Usuarios WHERE UsuarioId = @id');
  return result.recordset[0]?.UnidadPeso ?? 'kg';
}

export async function actualizarPerfil(usuarioId, { unidadPeso, pesoCorporal }) {
  const unidadFinal = unidadPeso ?? await obtenerUnidad(usuarioId);
  const cambiarPeso = pesoCorporal !== undefined;
  const pesoKg = cambiarPeso && pesoCorporal !== null ? aKg(pesoCorporal, unidadFinal) : null;

  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, usuarioId)
    .input('unidad', sql.Char(2), unidadFinal)
    .input('cambiarPeso', sql.Bit, cambiarPeso)
    .input('pesoKg', sql.Decimal(5, 2), pesoKg)
    .query(`
      UPDATE Usuarios
      SET UnidadPeso = @unidad,
          PesoCorporalKg = CASE WHEN @cambiarPeso = 1 THEN @pesoKg ELSE PesoCorporalKg END
      WHERE UsuarioId = @id
    `);

  return obtenerPerfil(usuarioId);
}