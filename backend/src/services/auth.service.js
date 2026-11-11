import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

export async function registrarUsuario({ nombre, email, password }) {
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
    .query(`
      INSERT INTO Usuarios (Nombre, Email, PasswordHash)
      OUTPUT INSERTED.UsuarioId AS id, INSERTED.Nombre AS nombre, INSERTED.Email AS email
      VALUES (@nombre, @email, @hash)
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
             PesoCorporalKg AS pesoCorporalKg, UnidadPeso AS unidadPeso,
             FechaRegistro AS fechaRegistro
      FROM Usuarios WHERE UsuarioId = @id AND Activo = 1
    `);

  if (!result.recordset[0]) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return result.recordset[0];
}