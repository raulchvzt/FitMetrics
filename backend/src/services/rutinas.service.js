import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

// ---------- Lectura ----------

export async function listarRutinas(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT r.RutinaId AS id, r.Nombre AS nombre, r.Descripcion AS descripcion,
             r.FechaCreacion AS fechaCreacion,
             COUNT(re.RutinaEjercicioId)        AS totalEjercicios,
             ISNULL(SUM(re.SeriesObjetivo), 0)  AS totalSeries
      FROM Rutinas r
      LEFT JOIN RutinaEjercicios re ON re.RutinaId = r.RutinaId
      WHERE r.UsuarioId = @usuarioId AND r.Activa = 1
      GROUP BY r.RutinaId, r.Nombre, r.Descripcion, r.FechaCreacion
      ORDER BY r.FechaCreacion DESC
    `);
  return result.recordset;
}

export async function obtenerRutina(usuarioId, rutinaId) {
  const pool = await getPool();

  const rutina = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('rutinaId', sql.Int, rutinaId)
    .query(`
      SELECT RutinaId AS id, Nombre AS nombre, Descripcion AS descripcion,
             FechaCreacion AS fechaCreacion
      FROM Rutinas
      WHERE RutinaId = @rutinaId AND UsuarioId = @usuarioId AND Activa = 1
    `);

  if (!rutina.recordset[0]) {
    throw new HttpError(404, 'Rutina no encontrada');
  }

  const ejercicios = await pool.request()
    .input('rutinaId', sql.Int, rutinaId)
    .query(`
      SELECT re.Orden AS orden, e.EjercicioId AS ejercicioId, e.Nombre AS nombre,
             re.SeriesObjetivo AS series, re.RepsMin AS repsMin, re.RepsMax AS repsMax,
             re.RIRObjetivo AS rir, re.DescansoSeg AS descansoSeg
      FROM RutinaEjercicios re
      JOIN Ejercicios e ON e.EjercicioId = re.EjercicioId
      WHERE re.RutinaId = @rutinaId
      ORDER BY re.Orden
    `);

  return { ...rutina.recordset[0], ejercicios: ejercicios.recordset };
}

// ---------- Escritura ----------

async function insertarEjercicios(transaction, rutinaId, usuarioId, ejercicios) {
  for (const [index, ej] of ejercicios.entries()) {
    const result = await new sql.Request(transaction)
      .input('rutinaId', sql.Int, rutinaId)
      .input('usuarioId', sql.Int, usuarioId)
      .input('ejercicioId', sql.Int, ej.ejercicioId)
      .input('orden', sql.TinyInt, index + 1)
      .input('series', sql.TinyInt, ej.series)
      .input('repsMin', sql.TinyInt, ej.repsMin)
      .input('repsMax', sql.TinyInt, ej.repsMax)
      .input('rir', sql.TinyInt, ej.rir)
      .input('descanso', sql.SmallInt, ej.descansoSeg)
      .query(`
        INSERT INTO RutinaEjercicios
          (RutinaId, EjercicioId, Orden, SeriesObjetivo, RepsMin, RepsMax, RIRObjetivo, DescansoSeg)
        SELECT @rutinaId, EjercicioId, @orden, @series, @repsMin, @repsMax, @rir, @descanso
        FROM Ejercicios
        WHERE EjercicioId = @ejercicioId
          AND (UsuarioId IS NULL OR UsuarioId = @usuarioId)
      `);

    if (result.rowsAffected[0] === 0) {
      throw new HttpError(400, `El ejercicio ${ej.ejercicioId} no existe`);
    }
  }
}

export async function crearRutina(usuarioId, datos) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('usuarioId', sql.Int, usuarioId)
      .input('nombre', sql.NVarChar(100), datos.nombre)
      .input('descripcion', sql.NVarChar(300), datos.descripcion)
      .query(`
        INSERT INTO Rutinas (UsuarioId, Nombre, Descripcion)
        OUTPUT INSERTED.RutinaId AS id
        VALUES (@usuarioId, @nombre, @descripcion)
      `);

    const rutinaId = result.recordset[0].id;
    await insertarEjercicios(transaction, rutinaId, usuarioId, datos.ejercicios);

    await transaction.commit();
    return obtenerRutina(usuarioId, rutinaId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function actualizarRutina(usuarioId, rutinaId, datos) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('usuarioId', sql.Int, usuarioId)
      .input('rutinaId', sql.Int, rutinaId)
      .input('nombre', sql.NVarChar(100), datos.nombre)
      .input('descripcion', sql.NVarChar(300), datos.descripcion)
      .query(`
        UPDATE Rutinas SET Nombre = @nombre, Descripcion = @descripcion
        WHERE RutinaId = @rutinaId AND UsuarioId = @usuarioId AND Activa = 1
      `);

    if (result.rowsAffected[0] === 0) {
      throw new HttpError(404, 'Rutina no encontrada');
    }

    await new sql.Request(transaction)
      .input('rutinaId', sql.Int, rutinaId)
      .query('DELETE FROM RutinaEjercicios WHERE RutinaId = @rutinaId');

    await insertarEjercicios(transaction, rutinaId, usuarioId, datos.ejercicios);

    await transaction.commit();
    return obtenerRutina(usuarioId, rutinaId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function desactivarRutina(usuarioId, rutinaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('rutinaId', sql.Int, rutinaId)
    .query(`
      UPDATE Rutinas SET Activa = 0
      WHERE RutinaId = @rutinaId AND UsuarioId = @usuarioId AND Activa = 1
    `);

  if (result.rowsAffected[0] === 0) {
    throw new HttpError(404, 'Rutina no encontrada');
  }
}