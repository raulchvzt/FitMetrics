/* =====================================================================
   Migración 06: foto de cada rutina
   - Si la rutina no tiene foto propia, el frontend le asigna una de
     gimnasio al azar (siempre la misma para esa rutina).
   - La foto propia se guarda como "data URL", igual que la de perfil;
     el frontend la recorta a 800x450 (unos 60 KB).
   Ejecutar con Autenticación de Windows. Si ya se aplicó, no hace nada.
   ===================================================================== */
USE FitMetrics;
GO

IF COL_LENGTH('Rutinas', 'Foto') IS NOT NULL
BEGIN
    PRINT 'La migración 06 ya estaba aplicada. No se hizo ningún cambio.';
    SET NOEXEC ON;
END
GO

ALTER TABLE Rutinas ADD
    Foto VARCHAR(MAX) NULL
        CONSTRAINT CK_Rutinas_Foto
            CHECK (Foto LIKE 'data:image/%;base64,%' AND LEN(Foto) <= 400000);
GO

PRINT 'Migración 06 terminada.';
GO
SET NOEXEC OFF;
GO
