/* =====================================================================
   Migración 10: catálogo e imagen de los suplementos
   - Catalogo: de qué suplemento del catálogo viene (creatina, whey, omega3...).
     Decide la sección y la ilustración. NULL = suplemento escrito a mano.
   - Foto: foto propia del bote (data URL), igual que en rutinas.
   Ejecutar con Autenticación de Windows. Si ya se aplicó, no hace nada.
   ===================================================================== */
USE FitMetrics;
GO

IF COL_LENGTH('Suplementos', 'Catalogo') IS NOT NULL
BEGIN
    PRINT 'La migración 10 ya estaba aplicada. No se hizo ningún cambio.';
    SET NOEXEC ON;
END
GO

ALTER TABLE Suplementos ADD
    Catalogo VARCHAR(30) NULL,
    Foto VARCHAR(MAX) NULL
        CONSTRAINT CK_Suplementos_Foto
            CHECK (Foto LIKE 'data:image/%;base64,%' AND LEN(Foto) <= 400000);
GO

-- Los suplementos que ya tenías: si el nombre se parece a uno del catálogo, se relaciona
UPDATE Suplementos SET Catalogo = CASE
    WHEN Nombre LIKE N'%creatina%'                         THEN 'creatina'
    WHEN Nombre LIKE N'%pre%work%' OR Nombre LIKE N'%pre%entreno%' THEN 'preentreno'
    WHEN Nombre LIKE N'%cafe_na%'                          THEN 'cafeina'
    WHEN Nombre LIKE N'%isolat%' OR Nombre LIKE N'%aislad%' THEN 'isolate'
    WHEN Nombre LIKE N'%case_na%'                          THEN 'caseina'
    WHEN Nombre LIKE N'%whey%' OR Nombre LIKE N'%prote_na%' THEN 'whey'
    WHEN Nombre LIKE N'%glutamina%'                        THEN 'glutamina'
    WHEN Nombre LIKE N'%bcaa%'                             THEN 'bcaa'
    WHEN Nombre LIKE N'%electrol%'                         THEN 'electrolitos'
    WHEN Nombre LIKE N'%omega%'                            THEN 'omega3'
    WHEN Nombre LIKE N'%multivit%'                         THEN 'multivitaminico'
    WHEN Nombre LIKE N'%vitamina d%'                       THEN 'vitamina-d'
    WHEN Nombre LIKE N'%magnesio%'                         THEN 'magnesio'
    WHEN Nombre LIKE N'%col_geno%'                         THEN 'colageno'
END
WHERE Catalogo IS NULL;
GO

SELECT Nombre, Catalogo FROM Suplementos WHERE Activo = 1 ORDER BY Nombre;
PRINT 'Migración 10 terminada.';
GO
SET NOEXEC OFF;
GO
