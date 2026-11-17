import { getPool, sql } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

// SQL devuelve una fila por cada músculo; las agrupamos por ejercicio
function agrupar(filas) {
  const porId = new Map();
  for (const f of filas) {
    if (!porId.has(f.id)) {
      porId.set(f.id, {
        id: f.id,
        nombre: f.nombre,
        tipo: f.tipo,
        equipo: f.equipo,
        incrementoKg: f.incrementoKg,
        propio: f.propio,
        musculos: []
      });
    }
    porId.get(f.id).musculos.push({ id: f.grupoMuscularId, nombre: f.musculo, factor: f.factor });
  }
  return [...porId.values()];
}

const SELECT_EJERCICIOS = `
  SELECT e.EjercicioId AS id, e.Nombre AS nombre, e.Tipo AS tipo, e.Equipo AS equipo,
         e.IncrementoKg AS incrementoKg,
         CAST(CASE WHEN e.UsuarioId IS NULL THEN 0 ELSE 1 END AS BIT) AS propio,
         g.GrupoMuscularId AS grupoMuscularId, g.Nombre AS musculo, em.Factor AS factor
  FROM Ejercicios e
  JOIN EjercicioMusculos em ON em.EjercicioId = e.EjercicioId
  JOIN GruposMusculares g   ON g.GrupoMuscularId = em.GrupoMuscularId
`;

// ---------- Lectura ----------

// El catálogo global más los ejercicios que creó el usuario
export async function listar(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      ${SELECT_EJERCICIOS}
      WHERE e.UsuarioId IS NULL OR e.UsuarioId = @usuarioId
      ORDER BY e.Nombre, em.Factor DESC
    `);
  return agrupar(result.recordset);
}

export async function gruposMusculares() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT GrupoMuscularId AS id, Nombre AS nombre
    FROM GruposMusculares
    ORDER BY GrupoMuscularId
  `);
  return result.recordset;
}

async function obtenerPropio(pool, usuarioId, ejercicioId) {
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('ejercicioId', sql.Int, ejercicioId)
    .query(`
      ${SELECT_EJERCICIOS}
      WHERE e.EjercicioId = @ejercicioId AND e.UsuarioId = @usuarioId
      ORDER BY em.Factor DESC
    `);
  const [ejercicio] = agrupar(result.recordset);
  if (!ejercicio) {
    throw new HttpError(404, 'Ejercicio no encontrado (solo puedes cambiar los que creaste tú)');
  }
  return ejercicio;
}

// ---------- Escritura ----------

async function validarNombreLibre(request, nombre, excluirId) {
  // La intercalación de SQL Server ignora mayúsculas y acentos al comparar
  const result = await request
    .input('nombreBuscado', sql.NVarChar(100), nombre)
    .input('excluirId', sql.Int, excluirId ?? 0)
    .query(`
      SELECT TOP 1 CASE WHEN UsuarioId IS NULL THEN 'global' ELSE 'propio' END AS origen
      FROM Ejercicios
      WHERE Nombre = @nombreBuscado
        AND (UsuarioId IS NULL OR UsuarioId = @usuarioId)
        AND EjercicioId <> @excluirId
    `);

  const choque = result.recordset[0];
  if (choque) {
    throw new HttpError(409, choque.origen === 'global'
      ? `"${nombre}" ya está en el catálogo: búscalo en el selector`
      : `Ya tienes un ejercicio llamado "${nombre}"`);
  }
}

async function guardarMusculos(transaction, ejercicioId, musculos) {
  await new sql.Request(transaction)
    .input('ejercicioId', sql.Int, ejercicioId)
    .query('DELETE FROM EjercicioMusculos WHERE EjercicioId = @ejercicioId');

  for (const m of musculos) {
    const result = await new sql.Request(transaction)
      .input('ejercicioId', sql.Int, ejercicioId)
      .input('grupoId', sql.Int, m.grupoMuscularId)
      .input('factor', sql.Decimal(3, 2), m.factor)
      .query(`
        INSERT INTO EjercicioMusculos (EjercicioId, GrupoMuscularId, Factor)
        SELECT @ejercicioId, GrupoMuscularId, @factor
        FROM GruposMusculares WHERE GrupoMuscularId = @grupoId
      `);
    if (result.rowsAffected[0] === 0) {
      throw new HttpError(400, `El grupo muscular ${m.grupoMuscularId} no existe`);
    }
  }
}

async function enTransaccion(trabajo) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const resultado = await trabajo(transaction);
    await transaction.commit();
    return resultado;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// datos ya validados: { nombre, tipo, equipo, incrementoKg, musculos: [{ grupoMuscularId, factor }] }
export async function crear(usuarioId, datos) {
  const ejercicioId = await enTransaccion(async (transaction) => {
    await validarNombreLibre(new sql.Request(transaction).input('usuarioId', sql.Int, usuarioId), datos.nombre);

    const result = await new sql.Request(transaction)
      .input('usuarioId', sql.Int, usuarioId)
      .input('nombre', sql.NVarChar(100), datos.nombre)
      .input('tipo', sql.NVarChar(20), datos.tipo)
      .input('equipo', sql.NVarChar(30), datos.equipo)
      .input('incremento', sql.Decimal(4, 2), datos.incrementoKg)
      .query(`
        INSERT INTO Ejercicios (Nombre, Tipo, Equipo, IncrementoKg, UsuarioId)
        OUTPUT INSERTED.EjercicioId AS id
        VALUES (@nombre, @tipo, @equipo, @incremento, @usuarioId)
      `);

    const id = result.recordset[0].id;
    await guardarMusculos(transaction, id, datos.musculos);
    return id;
  });

  return obtenerPropio(await getPool(), usuarioId, ejercicioId);
}

export async function actualizar(usuarioId, ejercicioId, datos) {
  const pool = await getPool();
  await obtenerPropio(pool, usuarioId, ejercicioId);

  await enTransaccion(async (transaction) => {
    await validarNombreLibre(new sql.Request(transaction).input('usuarioId', sql.Int, usuarioId), datos.nombre, ejercicioId);

    await new sql.Request(transaction)
      .input('ejercicioId', sql.Int, ejercicioId)
      .input('nombre', sql.NVarChar(100), datos.nombre)
      .input('tipo', sql.NVarChar(20), datos.tipo)
      .input('equipo', sql.NVarChar(30), datos.equipo)
      .input('incremento', sql.Decimal(4, 2), datos.incrementoKg)
      .query(`
        UPDATE Ejercicios
        SET Nombre = @nombre, Tipo = @tipo, Equipo = @equipo, IncrementoKg = @incremento
        WHERE EjercicioId = @ejercicioId
      `);

    await guardarMusculos(transaction, ejercicioId, datos.musculos);
  });

  return obtenerPropio(pool, usuarioId, ejercicioId);
}

export async function eliminar(usuarioId, ejercicioId) {
  const pool = await getPool();
  await obtenerPropio(pool, usuarioId, ejercicioId);

  // Si ya tiene series o está en una rutina, borrarlo rompería tu historial
  const uso = await pool.request()
    .input('ejercicioId', sql.Int, ejercicioId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM Series WHERE EjercicioId = @ejercicioId) AS series,
        (SELECT COUNT(*) FROM RutinaEjercicios re
         JOIN Rutinas r ON r.RutinaId = re.RutinaId
         WHERE re.EjercicioId = @ejercicioId AND r.Activa = 1) AS rutinas
    `);

  const { series, rutinas } = uso.recordset[0];
  if (series > 0) {
    throw new HttpError(409, 'No se puede borrar: ya tiene series registradas en tu historial');
  }
  if (rutinas > 0) {
    throw new HttpError(409, 'No se puede borrar: quítalo primero de tus rutinas');
  }

  // Las rutinas borradas (inactivas) pueden conservarlo: se quita de ellas
  await enTransaccion(async (transaction) => {
    const request = new sql.Request(transaction).input('ejercicioId', sql.Int, ejercicioId);
    await request.query(`
      DELETE FROM RutinaEjercicios WHERE EjercicioId = @ejercicioId;
      DELETE FROM Ejercicios WHERE EjercicioId = @ejercicioId;
    `);
  });
}
