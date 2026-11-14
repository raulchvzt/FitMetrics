/* =====================================================================
   Migración 03: guardar todas las fechas en UTC
   Ejecutar con Autenticación de Windows. Si ya se aplicó, no hace nada.
   ===================================================================== */
USE FitMetrics;
GO

-- 0. Protección: si la migración ya se aplicó, no volver a correrla
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Sesiones_FechaInicio')
BEGIN
    PRINT 'La migración 03 ya estaba aplicada. No se hizo ningún cambio.';
    SET NOEXEC ON;
END
GO

SET XACT_ABORT ON;
BEGIN TRAN;

-- 1. Diferencia entre la hora de este servidor y UTC (en minutos, redondeada a 15)
DECLARE @desfase INT =
    CAST(ROUND(DATEDIFF(SECOND, SYSDATETIME(), SYSUTCDATETIME()) / 900.0, 0) AS INT) * 15;
PRINT CONCAT('Desfase aplicado: ', @desfase, ' minutos');

-- 2. Pasar las fechas existentes de hora local a UTC
UPDATE Usuarios SET FechaRegistro = DATEADD(MINUTE, @desfase, FechaRegistro);
UPDATE Rutinas  SET FechaCreacion = DATEADD(MINUTE, @desfase, FechaCreacion);
UPDATE Sesiones SET FechaInicio   = DATEADD(MINUTE, @desfase, FechaInicio),
                    FechaFin      = DATEADD(MINUTE, @desfase, FechaFin);
UPDATE Series   SET FechaRegistro = DATEADD(MINUTE, @desfase, FechaRegistro);

IF OBJECT_ID('MovimientosInventario') IS NOT NULL
    EXEC sp_executesql
        N'UPDATE MovimientosInventario SET Fecha = DATEADD(MINUTE, @d, Fecha)',
        N'@d INT', @d = @desfase;

-- 3. Cambiar los valores por defecto a SYSUTCDATETIME()
DECLARE @columnas TABLE (Tabla SYSNAME, Columna SYSNAME);
INSERT INTO @columnas VALUES
    ('Usuarios', 'FechaRegistro'),
    ('Rutinas', 'FechaCreacion'),
    ('Sesiones', 'FechaInicio'),
    ('Series', 'FechaRegistro'),
    ('MovimientosInventario', 'Fecha');

DECLARE @tabla SYSNAME, @columna SYSNAME, @restriccion SYSNAME, @sql NVARCHAR(500);

DECLARE recorrido CURSOR LOCAL FAST_FORWARD FOR
    SELECT Tabla, Columna FROM @columnas WHERE OBJECT_ID(Tabla) IS NOT NULL;

OPEN recorrido;
FETCH NEXT FROM recorrido INTO @tabla, @columna;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @restriccion = NULL;

    SELECT @restriccion = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id
                      AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(@tabla) AND c.name = @columna;

    IF @restriccion IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + QUOTENAME(@tabla) + N' DROP CONSTRAINT ' + QUOTENAME(@restriccion);
        EXEC sp_executesql @sql;
    END

    SET @sql = N'ALTER TABLE ' + QUOTENAME(@tabla)
             + N' ADD CONSTRAINT ' + QUOTENAME(N'DF_' + @tabla + N'_' + @columna)
             + N' DEFAULT SYSUTCDATETIME() FOR ' + QUOTENAME(@columna);
    EXEC sp_executesql @sql;

    FETCH NEXT FROM recorrido INTO @tabla, @columna;
END

CLOSE recorrido;
DEALLOCATE recorrido;

COMMIT;
GO

-- 4. El procedimiento de finalizar también usa la hora
CREATE OR ALTER PROCEDURE sp_FinalizarSesion
    @SesionId INT,
    @FatigaPercibida TINYINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRAN;

    DECLARE @UsuarioId INT;
    SELECT @UsuarioId = UsuarioId FROM Sesiones
    WHERE SesionId = @SesionId AND FechaFin IS NULL;

    IF @UsuarioId IS NULL
    BEGIN
        ROLLBACK;
        THROW 50001, 'La sesión no existe o ya fue finalizada.', 1;
    END

    UPDATE Sesiones
    SET FechaFin = SYSUTCDATETIME(), FatigaPercibida = @FatigaPercibida
    WHERE SesionId = @SesionId;

    INSERT INTO MovimientosInventario (SuplementoId, Tipo, Cantidad, SesionId, Nota)
    SELECT SuplementoId, 'Consumo', -DosisPorToma, @SesionId, 'Descuento automático por sesión'
    FROM Suplementos
    WHERE UsuarioId = @UsuarioId AND Activo = 1 AND Frecuencia = 'DiaEntreno'
      AND StockActual >= DosisPorToma;

    UPDATE Suplementos
    SET StockActual = StockActual - DosisPorToma
    WHERE UsuarioId = @UsuarioId AND Activo = 1 AND Frecuencia = 'DiaEntreno'
      AND StockActual >= DosisPorToma;

    COMMIT;
END;
GO

PRINT 'Migración 03 terminada.';
GO
SET NOEXEC OFF;
GO