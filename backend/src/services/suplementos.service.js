import { getPool, sql } from '../config/db.js';
import { ilustracionDe, seccionDe } from '../utils/catalogoSuplementos.js';
import { HttpError } from '../utils/httpError.js';
import { entrenosPorSemana, estadoInventario, pendienteHoy } from '../utils/suplementos.js';

const ZONA_HORARIA = process.env.ZONA_HORARIA || 'Central Standard Time (Mexico)';

// Ejecuta varias operaciones como una sola: o se guardan todas o ninguna.
async function enTransaccion(trabajo) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const resultado = await trabajo(() => new sql.Request(transaction));
    await transaction.commit();
    return resultado;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ---------- Lectura ----------

export async function listar(usuarioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('zona', sql.NVarChar(64), ZONA_HORARIA)
    .query(`
      DECLARE @hoy DATE = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE);

      SELECT s.SuplementoId AS id, s.Nombre AS nombre, s.Unidad AS unidad,
             s.DosisPorToma AS dosis, s.Frecuencia AS frecuencia, s.Momento AS momento,
             CONVERT(CHAR(5), s.HoraRecordatorio, 108) AS horaRecordatorio,
             s.StockActual AS stock, s.Presentacion AS presentacion, s.DiasAlerta AS diasAlerta,
             s.Catalogo AS catalogo, s.Foto AS foto,
             CAST(CASE WHEN EXISTS (
               SELECT 1 FROM MovimientosInventario m
               WHERE m.SuplementoId = s.SuplementoId
                 AND m.Tipo = 'Consumo'
                 AND m.Fecha >= DATEADD(DAY, -2, SYSUTCDATETIME())
                 AND CAST(m.Fecha AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE) = @hoy
             ) THEN 1 ELSE 0 END AS BIT) AS tomadoHoy
      FROM Suplementos s
      WHERE s.UsuarioId = @usuarioId AND s.Activo = 1
      ORDER BY s.Nombre;

      SELECT
        (SELECT COUNT(*) FROM Sesiones
         WHERE UsuarioId = @usuarioId AND FechaFin IS NOT NULL
           AND FechaInicio >= DATEADD(DAY, -28, SYSUTCDATETIME())) AS sesiones28,
        CAST(CASE WHEN EXISTS (
          SELECT 1 FROM Sesiones
          WHERE UsuarioId = @usuarioId
            AND FechaInicio >= DATEADD(DAY, -2, SYSUTCDATETIME())
            AND CAST(FechaInicio AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE) = @hoy
        ) THEN 1 ELSE 0 END AS BIT) AS entrenasteHoy;
    `);

  const [filas, [resumen]] = result.recordsets;
  const entrenosSemana = entrenosPorSemana(resumen.sesiones28);

  const suplementos = filas.map((s) => {
    const estado = estadoInventario(s, entrenosSemana);
    return {
      ...s,
      ...estado,
      pendienteHoy: pendienteHoy({ ...s, ...estado }, resumen.entrenasteHoy),
      seccion: seccionDe(s),
      ilustracion: ilustracionDe(s)
    };
  });

  return { entrenosPorSemana: entrenosSemana, entrenasteHoy: resumen.entrenasteHoy, suplementos };
}

export async function obtener(usuarioId, suplementoId) {
  const { suplementos } = await listar(usuarioId);
  const suplemento = suplementos.find((s) => s.id === suplementoId);
  if (!suplemento) throw new HttpError(404, 'Suplemento no encontrado');
  return suplemento;
}

export async function movimientos(usuarioId, suplementoId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('suplementoId', sql.Int, suplementoId)
    .query(`
      SELECT TOP 30 m.MovimientoId AS id, m.Tipo AS tipo, m.Cantidad AS cantidad,
             m.Fecha AS fecha, m.Nota AS nota
      FROM MovimientosInventario m
      JOIN Suplementos s ON s.SuplementoId = m.SuplementoId
      WHERE m.SuplementoId = @suplementoId AND s.UsuarioId = @usuarioId
      ORDER BY m.Fecha DESC, m.MovimientoId DESC
    `);
  return result.recordset;
}

// ---------- Escritura ----------

function entradasSuplemento(request, datos) {
  return request
    .input('nombre', sql.NVarChar(100), datos.nombre)
    .input('unidad', sql.NVarChar(20), datos.unidad)
    .input('dosis', sql.Decimal(7, 2), datos.dosis)
    .input('frecuencia', sql.NVarChar(20), datos.frecuencia)
    .input('momento', sql.NVarChar(20), datos.momento)
    .input('hora', sql.VarChar(5), datos.horaRecordatorio)
    .input('presentacion', sql.Decimal(9, 2), datos.presentacion)
    .input('diasAlerta', sql.TinyInt, datos.diasAlerta)
    .input('catalogo', sql.VarChar(30), datos.catalogo);
}

export async function crear(usuarioId, datos) {
  const id = await enTransaccion(async (nuevaPeticion) => {
    const result = await entradasSuplemento(nuevaPeticion(), datos)
      .input('usuarioId', sql.Int, usuarioId)
      .input('stock', sql.Decimal(9, 2), datos.stock)
      .query(`
        INSERT INTO Suplementos
          (UsuarioId, Nombre, Unidad, DosisPorToma, Frecuencia, Momento,
           HoraRecordatorio, Presentacion, DiasAlerta, StockActual, Catalogo)
        OUTPUT INSERTED.SuplementoId AS id
        VALUES (@usuarioId, @nombre, @unidad, @dosis, @frecuencia, @momento,
                TRY_CAST(@hora AS TIME(0)), @presentacion, @diasAlerta, @stock, @catalogo)
      `);

    const nuevoId = result.recordset[0].id;

    if (datos.stock > 0) {
      await nuevaPeticion()
        .input('id', sql.Int, nuevoId)
        .input('cantidad', sql.Decimal(9, 2), datos.stock)
        .query(`
          INSERT INTO MovimientosInventario (SuplementoId, Tipo, Cantidad, Nota)
          VALUES (@id, 'Compra', @cantidad, 'Stock inicial')
        `);
    }
    return nuevoId;
  });

  return obtener(usuarioId, id);
}

export async function actualizar(usuarioId, suplementoId, datos) {
  const pool = await getPool();
  const result = await entradasSuplemento(pool.request(), datos)
    .input('usuarioId', sql.Int, usuarioId)
    .input('id', sql.Int, suplementoId)
    .query(`
      UPDATE Suplementos
      SET Nombre = @nombre, Unidad = @unidad, DosisPorToma = @dosis, Frecuencia = @frecuencia,
          Momento = @momento, HoraRecordatorio = TRY_CAST(@hora AS TIME(0)),
          Presentacion = @presentacion, DiasAlerta = @diasAlerta, Catalogo = @catalogo
      WHERE SuplementoId = @id AND UsuarioId = @usuarioId AND Activo = 1
    `);

  if (result.rowsAffected[0] === 0) throw new HttpError(404, 'Suplemento no encontrado');
  return obtener(usuarioId, suplementoId);
}

export async function desactivar(usuarioId, suplementoId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('id', sql.Int, suplementoId)
    .query(`
      UPDATE Suplementos SET Activo = 0
      WHERE SuplementoId = @id AND UsuarioId = @usuarioId AND Activo = 1
    `);
  if (result.rowsAffected[0] === 0) throw new HttpError(404, 'Suplemento no encontrado');
}

// Lee el suplemento bloqueando su fila hasta terminar la transacción,
// para que dos toques seguidos no descuenten dos veces.
async function bloquearSuplemento(nuevaPeticion, usuarioId, suplementoId) {
  const result = await nuevaPeticion()
    .input('usuarioId', sql.Int, usuarioId)
    .input('id', sql.Int, suplementoId)
    .query(`
      SELECT DosisPorToma AS dosis, StockActual AS stock, Unidad AS unidad
      FROM Suplementos WITH (UPDLOCK, ROWLOCK)
      WHERE SuplementoId = @id AND UsuarioId = @usuarioId AND Activo = 1
    `);
  const fila = result.recordset[0];
  if (!fila) throw new HttpError(404, 'Suplemento no encontrado');
  return fila;
}

async function moverStock(nuevaPeticion, suplementoId, tipo, cantidad, nota) {
  await nuevaPeticion()
    .input('id', sql.Int, suplementoId)
    .input('tipo', sql.NVarChar(10), tipo)
    .input('cantidad', sql.Decimal(9, 2), cantidad)
    .input('nota', sql.NVarChar(200), nota)
    .query(`
      UPDATE Suplementos SET StockActual = StockActual + @cantidad WHERE SuplementoId = @id;
      INSERT INTO MovimientosInventario (SuplementoId, Tipo, Cantidad, Nota)
      VALUES (@id, @tipo, @cantidad, @nota);
    `);
}

export async function registrarToma(usuarioId, suplementoId) {
  await enTransaccion(async (nuevaPeticion) => {
    const { dosis, stock, unidad } = await bloquearSuplemento(nuevaPeticion, usuarioId, suplementoId);

    const tomas = await nuevaPeticion()
      .input('id', sql.Int, suplementoId)
      .input('zona', sql.NVarChar(64), ZONA_HORARIA)
      .query(`
        SELECT COUNT(*) AS total FROM MovimientosInventario
        WHERE SuplementoId = @id AND Tipo = 'Consumo'
          AND Fecha >= DATEADD(DAY, -2, SYSUTCDATETIME())
          AND CAST(Fecha AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE)
            = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE)
      `);

    if (tomas.recordset[0].total > 0) {
      throw new HttpError(409, 'Ya registraste la toma de hoy');
    }
    if (stock < dosis) {
      throw new HttpError(409, `Solo te quedan ${stock} ${unidad}: registra una compra para seguir`);
    }

    await moverStock(nuevaPeticion, suplementoId, 'Consumo', -dosis, 'Toma confirmada');
  });

  return obtener(usuarioId, suplementoId);
}

export async function deshacerToma(usuarioId, suplementoId) {
  await enTransaccion(async (nuevaPeticion) => {
    await bloquearSuplemento(nuevaPeticion, usuarioId, suplementoId);

    const result = await nuevaPeticion()
      .input('id', sql.Int, suplementoId)
      .input('zona', sql.NVarChar(64), ZONA_HORARIA)
      .query(`
        DELETE TOP (1) FROM MovimientosInventario
        OUTPUT DELETED.Cantidad AS cantidad
        WHERE MovimientoId = (
          SELECT TOP 1 MovimientoId FROM MovimientosInventario
          WHERE SuplementoId = @id AND Tipo = 'Consumo'
            AND Fecha >= DATEADD(DAY, -2, SYSUTCDATETIME())
            AND CAST(Fecha AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE)
              = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE @zona AS DATE)
          ORDER BY Fecha DESC
        )
      `);

    const borrado = result.recordset[0];
    if (!borrado) throw new HttpError(404, 'No hay una toma de hoy para deshacer');

    await nuevaPeticion()
      .input('id', sql.Int, suplementoId)
      .input('cantidad', sql.Decimal(9, 2), -borrado.cantidad)
      .query('UPDATE Suplementos SET StockActual = StockActual + @cantidad WHERE SuplementoId = @id');
  });

  return obtener(usuarioId, suplementoId);
}

export async function registrarCompra(usuarioId, suplementoId, cantidad) {
  await enTransaccion(async (nuevaPeticion) => {
    await bloquearSuplemento(nuevaPeticion, usuarioId, suplementoId);
    await moverStock(nuevaPeticion, suplementoId, 'Compra', cantidad, 'Compra registrada');
  });
  return obtener(usuarioId, suplementoId);
}

export async function ajustarStock(usuarioId, suplementoId, stockNuevo) {
  await enTransaccion(async (nuevaPeticion) => {
    const { stock } = await bloquearSuplemento(nuevaPeticion, usuarioId, suplementoId);
    const diferencia = Math.round((stockNuevo - stock) * 100) / 100;
    if (diferencia !== 0) {
      await moverStock(nuevaPeticion, suplementoId, 'Ajuste', diferencia, 'Ajuste manual de inventario');
    }
  });
  return obtener(usuarioId, suplementoId);
}
// foto = data URL ya validada, o null para volver a la ilustración
export async function actualizarFoto(usuarioId, suplementoId, foto) {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('id', sql.Int, suplementoId)
    .input('foto', sql.VarChar(sql.MAX), foto)
    .query(`
      UPDATE Suplementos SET Foto = @foto
      WHERE SuplementoId = @id AND UsuarioId = @usuarioId AND Activo = 1
    `);
  if (result.rowsAffected[0] === 0) throw new HttpError(404, 'Suplemento no encontrado');
  return obtener(usuarioId, suplementoId);
}
