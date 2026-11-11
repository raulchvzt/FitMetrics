/* =====================================================================
   Migración 02: precisión de 3 decimales en el peso para soportar lb
   ===================================================================== */
USE FitMetrics;
GO

-- 1. Quitar la regla CHECK de PesoKg (SQL Server le puso un nombre automático)
DECLARE @constraint SYSNAME;

SELECT @constraint = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON c.object_id = cc.parent_object_id
                  AND c.column_id = cc.parent_column_id
WHERE cc.parent_object_id = OBJECT_ID('Series') AND c.name = 'PesoKg';

IF @constraint IS NOT NULL
    EXEC('ALTER TABLE Series DROP CONSTRAINT ' + QUOTENAME(@constraint));
GO

-- 2. Quitar la columna calculada que depende del peso
ALTER TABLE Series DROP COLUMN E1RM;
GO

-- 3. Cambiar la precisión
ALTER TABLE Series ALTER COLUMN PesoKg DECIMAL(7,3) NOT NULL;
GO

-- 4. Volver a crear la regla y la columna calculada
ALTER TABLE Series ADD CONSTRAINT CK_Series_PesoKg CHECK (PesoKg >= 0 AND PesoKg <= 999);
ALTER TABLE Series ADD E1RM AS (CAST(PesoKg * (1 + Reps / 30.0) AS DECIMAL(8,3))) PERSISTED;
GO

-- 5. Actualizar las vistas que usan estas columnas
EXEC sp_refreshview 'vw_E1RMDiario';
EXEC sp_refreshview 'vw_VolumenSemanal';
GO

PRINT 'Migración 02 aplicada correctamente.';