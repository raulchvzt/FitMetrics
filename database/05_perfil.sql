/* =====================================================================
   Migración 05: foto de perfil
   - La foto se guarda como "data URL" (texto base64 de una imagen JPEG,
     PNG o WebP). El frontend la recorta a 400x400 antes de subirla,
     así que ocupa alrededor de 40 KB.
   Ejecutar con Autenticación de Windows. Si ya se aplicó, no hace nada.
   ===================================================================== */
USE FitMetrics;
GO

IF COL_LENGTH('Usuarios', 'FotoPerfil') IS NOT NULL
BEGIN
    PRINT 'La migración 05 ya estaba aplicada. No se hizo ningún cambio.';
    SET NOEXEC ON;
END
GO

ALTER TABLE Usuarios ADD
    FotoPerfil VARCHAR(MAX) NULL
        CONSTRAINT CK_Usuarios_FotoPerfil
            CHECK (FotoPerfil LIKE 'data:image/%;base64,%' AND LEN(FotoPerfil) <= 400000);
GO

PRINT 'Migración 05 terminada.';
GO
SET NOEXEC OFF;
GO
