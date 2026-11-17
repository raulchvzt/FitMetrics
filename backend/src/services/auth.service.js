import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { aKg, desdeKg } from '../utils/unidades.js';

// Hash de una contraseña que nadie conoce (solo para igualar tiempos en el login)
const HASH_FALSO = bcrypt.hashSync('fitmetrics-usuario-inexistente', 10);

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    // 30 días: en la app instalada no tienes que iniciar sesión a cada rato
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
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
  // Aunque el correo no exista, se compara contra un hash falso: así la respuesta
  // tarda lo mismo y nadie puede averiguar qué correos tienen cuenta midiendo tiempos
  const passwordCorrecta = await bcrypt.compare(password, fila?.PasswordHash ?? HASH_FALSO);

  if (!fila || !passwordCorrecta || !fila.Activo) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }

  const usuario = { id: fila.id, nombre: fila.nombre, email: fila.email };
  return { token: generarToken(usuario), usuario };
}

// La foto pesa varios KB: solo se incluye cuando se pide (pantalla de perfil e inicio)
export async function obtenerPerfil(usuarioId, { conFoto = false } = {}) {
  const pool = await getPool();

  const result = await pool.request()
    .input('id', sql.Int, usuarioId)
    .input('conFoto', sql.Bit, conFoto)
    .query(`
      SELECT UsuarioId AS id, Nombre AS nombre, Email AS email,
             PesoCorporalKg, UnidadPeso AS unidadPeso,
             FechaRegistro AS fechaRegistro,
             CASE WHEN @conFoto = 1 THEN FotoPerfil END AS foto
      FROM Usuarios WHERE UsuarioId = @id AND Activo = 1
    `);

  const fila = result.recordset[0];
  if (!fila) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const { PesoCorporalKg, foto, ...perfil } = fila;
  return {
    ...perfil,
    pesoCorporal: desdeKg(PesoCorporalKg, fila.unidadPeso),
    ...(conFoto && { foto })
  };
}

export async function obtenerUnidad(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, usuarioId)
    .query('SELECT UnidadPeso FROM Usuarios WHERE UsuarioId = @id');
  return result.recordset[0]?.UnidadPeso ?? 'kg';
}

export async function actualizarPerfil(usuarioId, { nombre, unidadPeso, pesoCorporal }) {
  const unidadFinal = unidadPeso ?? await obtenerUnidad(usuarioId);
  const cambiarPeso = pesoCorporal !== undefined;
  const pesoKg = cambiarPeso && pesoCorporal !== null ? aKg(pesoCorporal, unidadFinal) : null;

  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, usuarioId)
    .input('nombre', sql.NVarChar(100), nombre ?? null)
    .input('unidad', sql.Char(2), unidadFinal)
    .input('cambiarPeso', sql.Bit, cambiarPeso)
    .input('pesoKg', sql.Decimal(5, 2), pesoKg)
    .query(`
      UPDATE Usuarios
      SET Nombre = ISNULL(@nombre, Nombre),
          UnidadPeso = @unidad,
          PesoCorporalKg = CASE WHEN @cambiarPeso = 1 THEN @pesoKg ELSE PesoCorporalKg END
      WHERE UsuarioId = @id
    `);

  return obtenerPerfil(usuarioId, { conFoto: true });
}

// foto = data URL ya validada, o null para quitarla
export async function actualizarFoto(usuarioId, foto) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, usuarioId)
    .input('foto', sql.VarChar(sql.MAX), foto)
    .query('UPDATE Usuarios SET FotoPerfil = @foto WHERE UsuarioId = @id');

  return obtenerPerfil(usuarioId, { conFoto: true });
}

export async function cambiarPassword(usuarioId, { actual, nueva }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, usuarioId)
    .query('SELECT PasswordHash FROM Usuarios WHERE UsuarioId = @id AND Activo = 1');

  const fila = result.recordset[0];
  if (!fila || !await bcrypt.compare(actual, fila.PasswordHash)) {
    throw new HttpError(400, 'La contraseña actual no es correcta');
  }

  const passwordHash = await bcrypt.hash(nueva, 10);
  await pool.request()
    .input('id', sql.Int, usuarioId)
    .input('hash', sql.NVarChar(255), passwordHash)
    .query('UPDATE Usuarios SET PasswordHash = @hash WHERE UsuarioId = @id');
}
