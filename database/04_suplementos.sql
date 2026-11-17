/* =====================================================================
   Migración 04: inventario de suplementos con tomas confirmadas
   - Momento de la toma y hora del recordatorio
   - Presentación (tamaño del envase) para registrar compras rápido
   - El consumo ya NO se descuenta solo al finalizar el entrenamiento:
     se descuenta cuando el usuario confirma que tomó la dosis.
   Ejecutar con Autenticación de Windows. Si ya se aplicó, no hace nada.
   ===================================================================== */
USE FitMetrics;
GO

IF COL_LENGTH('Suplementos', 'Momento') IS NOT NULL
BEGIN
    PRINT 'La migración 04 ya estaba aplicada. No se hizo ningún cambio.';
    SET NOEXEC ON;
END
GO

-- 1. Columnas nuevas
ALTER TABLE Suplementos ADD
    Momento NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Suplementos_Momento DEFAULT 'Cualquiera'
        CONSTRAINT CK_Suplementos_Momento
            CHECK (Momento IN ('Cualquiera', 'AntesEntrenar', 'DespuesEntrenar')),
    HoraRecordatorio TIME(0) NULL,
    Presentacion DECIMAL(9,2) NULL
        CONSTRAINT CK_Suplementos_Presentacion CHECK (Presentacion > 0);
GO

-- 2. El stock nunca puede ser negativo
ALTER TABLE Suplementos ADD CONSTRAINT CK_Suplementos_Stock CHECK (StockActual >= 0);
GO

-- 3. Índice para encontrar rápido las tomas de un suplemento por fecha
CREATE INDEX IX_Movimientos_Suplemento ON MovimientosInventario (SuplementoId, Fecha);
GO

-- 4. Finalizar sesión solo cierra la sesión (ya no descuenta suplementos)
CREATE OR ALTER PROCEDURE sp_FinalizarSesion
    @SesionId INT,
    @FatigaPercibida TINYINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Sesiones
    SET FechaFin = SYSUTCDATETIME(), FatigaPercibida = @FatigaPercibida
    WHERE SesionId = @SesionId AND FechaFin IS NULL;

    IF @@ROWCOUNT = 0
        THROW 50001, 'La sesión no existe o ya fue finalizada.', 1;
END;
GO

-- 5. La vista anterior suponía 4 entrenamientos por semana; ahora se calcula en el backend
DROP VIEW IF EXISTS vw_EstadoSuplementos;
GO

PRINT 'Migración 04 terminada.';
GO
SET NOEXEC OFF;
GO