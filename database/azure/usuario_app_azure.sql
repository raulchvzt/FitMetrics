/* =====================================================================
   Usuario de la API en Azure SQL Database
   - En Azure no hay "logins" del servidor como en tu PC: se crea un
     usuario contenido en la base, con su propia contraseña.
   - Córrelo en SSMS conectado a tu servidor de Azure, con la base
     FitMetrics seleccionada (no master), DESPUÉS de crear las tablas.
   - Cambia la contraseña y usa la misma en DB_PASSWORD de Render.
     Azure exige: 8+ caracteres con mayúsculas, minúsculas, números y símbolos.
   - La app solo puede leer, escribir y ejecutar procedimientos.
   Se puede correr más de una vez.
   ===================================================================== */

IF DB_NAME() = 'master'
BEGIN
    RAISERROR('Selecciona la base FitMetrics (arriba en SSMS), no master.', 16, 1);
    SET NOEXEC ON;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'fitmetrics_app')
    CREATE USER fitmetrics_app WITH PASSWORD = 'CAMBIA_ESTA_CONTRASEÑA_1!';
GO

ALTER ROLE db_datareader ADD MEMBER fitmetrics_app;
ALTER ROLE db_datawriter ADD MEMBER fitmetrics_app;
GRANT EXECUTE TO fitmetrics_app;
GO

PRINT 'Usuario fitmetrics_app listo en Azure.';
GO

SET NOEXEC OFF;
GO
