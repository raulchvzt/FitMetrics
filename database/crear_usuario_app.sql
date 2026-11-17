/* =====================================================================
   Usuario de SQL Server para la API de FitMetrics
   - Córrelo DESPUÉS de crear la base (01) y antes de encender el backend.
   - Cambia la contraseña y usa la misma en DB_PASSWORD del archivo .env.
   - La app solo puede leer, escribir y ejecutar procedimientos: no puede
     borrar tablas ni cambiar la estructura (principio de mínimo privilegio).
   Ejecutar con Autenticación de Windows. Se puede correr más de una vez.
   ===================================================================== */
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'fitmetrics_app')
    CREATE LOGIN fitmetrics_app
        WITH PASSWORD = 'CAMBIA_ESTA_CONTRASEÑA_1!',
             CHECK_POLICY = ON;
GO

USE FitMetrics;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'fitmetrics_app')
    CREATE USER fitmetrics_app FOR LOGIN fitmetrics_app;
GO

ALTER ROLE db_datareader ADD MEMBER fitmetrics_app;
ALTER ROLE db_datawriter ADD MEMBER fitmetrics_app;
GRANT EXECUTE TO fitmetrics_app;
GO

PRINT 'Usuario fitmetrics_app listo.';
GO
