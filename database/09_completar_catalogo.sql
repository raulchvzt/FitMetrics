/* =====================================================================
   Migración 09: completar el catálogo original
   - Si a tu base le faltaba alguno de los 14 ejercicios originales
     (por ejemplo, Prensa o Press militar), aquí se agrega con sus
     músculos y su foto. Los que ya existen no se tocan.
   - Se puede correr más de una vez.
   Ejecutar con Autenticación de Windows.
   ===================================================================== */
USE FitMetrics;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @Originales TABLE (
    Nombre NVARCHAR(100) NOT NULL PRIMARY KEY,
    Tipo NVARCHAR(20) NOT NULL,
    Equipo NVARCHAR(30) NOT NULL,
    IncrementoKg DECIMAL(4,2) NOT NULL,
    Imagen VARCHAR(80) NULL
);

INSERT INTO @Originales (Nombre, Tipo, Equipo, IncrementoKg, Imagen) VALUES
 (N'Press de banca', 'Compuesto', N'Barra', 2.5, 'barbell-bench-press-medium-grip'),
 (N'Press inclinado', 'Compuesto', N'Mancuerna', 2.0, 'incline-dumbbell-press'),
 (N'Dominadas', 'Compuesto', N'Peso corporal', 2.5, 'pullups'),
 (N'Remo con barra', 'Compuesto', N'Barra', 2.5, 'bent-over-barbell-row'),
 (N'Press militar', 'Compuesto', N'Barra', 2.5, 'standing-military-press'),
 (N'Elevaciones laterales', 'Aislamiento', N'Mancuerna', 1.0, 'side-lateral-raise'),
 (N'Face pull', 'Aislamiento', N'Polea', 2.5, 'face-pull'),
 (N'Curl con barra', 'Aislamiento', N'Barra', 1.25, 'barbell-curl'),
 (N'Extensión de tríceps en polea', 'Aislamiento', N'Polea', 2.5, 'triceps-pushdown'),
 (N'Sentadilla', 'Compuesto', N'Barra', 2.5, 'barbell-squat'),
 (N'Peso muerto rumano', 'Compuesto', N'Barra', 2.5, 'romanian-deadlift'),
 (N'Prensa', 'Compuesto', N'Máquina', 5.0, 'leg-press'),
 (N'Curl femoral', 'Aislamiento', N'Máquina', 2.5, 'lying-leg-curls'),
 (N'Elevación de talones', 'Aislamiento', N'Máquina', 5.0, 'standing-calf-raises');

DECLARE @Musculos TABLE (Ejercicio NVARCHAR(100), Musculo NVARCHAR(50), Factor DECIMAL(3,2));
INSERT INTO @Musculos (Ejercicio, Musculo, Factor) VALUES
 (N'Press de banca', N'Pecho', 1.0),
 (N'Press de banca', N'Tríceps', 0.5),
 (N'Press de banca', N'Hombro anterior', 0.5),
 (N'Press inclinado', N'Pecho', 1.0),
 (N'Press inclinado', N'Hombro anterior', 0.5),
 (N'Press inclinado', N'Tríceps', 0.5),
 (N'Dominadas', N'Espalda', 1.0),
 (N'Dominadas', N'Bíceps', 0.5),
 (N'Remo con barra', N'Espalda', 1.0),
 (N'Remo con barra', N'Bíceps', 0.5),
 (N'Remo con barra', N'Hombro posterior', 0.5),
 (N'Press militar', N'Hombro anterior', 1.0),
 (N'Press militar', N'Tríceps', 0.5),
 (N'Press militar', N'Hombro lateral', 0.5),
 (N'Elevaciones laterales', N'Hombro lateral', 1.0),
 (N'Face pull', N'Hombro posterior', 1.0),
 (N'Curl con barra', N'Bíceps', 1.0),
 (N'Extensión de tríceps en polea', N'Tríceps', 1.0),
 (N'Sentadilla', N'Cuádriceps', 1.0),
 (N'Sentadilla', N'Glúteos', 0.5),
 (N'Peso muerto rumano', N'Isquiotibiales', 1.0),
 (N'Peso muerto rumano', N'Glúteos', 0.5),
 (N'Prensa', N'Cuádriceps', 1.0),
 (N'Prensa', N'Glúteos', 0.5),
 (N'Curl femoral', N'Isquiotibiales', 1.0),
 (N'Elevación de talones', N'Pantorrillas', 1.0);

-- 1. Los ejercicios que faltan
INSERT INTO Ejercicios (Nombre, Tipo, Equipo, IncrementoKg, Imagen)
SELECT o.Nombre, o.Tipo, o.Equipo, o.IncrementoKg, o.Imagen
FROM @Originales o
WHERE NOT EXISTS (SELECT 1 FROM Ejercicios e WHERE e.Nombre = o.Nombre AND e.UsuarioId IS NULL);

PRINT CONCAT('Ejercicios agregados: ', @@ROWCOUNT);

-- 2. Sus músculos
INSERT INTO EjercicioMusculos (EjercicioId, GrupoMuscularId, Factor)
SELECT e.EjercicioId, g.GrupoMuscularId, m.Factor
FROM @Musculos m
JOIN Ejercicios e       ON e.Nombre = m.Ejercicio AND e.UsuarioId IS NULL
JOIN GruposMusculares g ON g.Nombre = m.Musculo
WHERE NOT EXISTS (
    SELECT 1 FROM EjercicioMusculos x
    WHERE x.EjercicioId = e.EjercicioId AND x.GrupoMuscularId = g.GrupoMuscularId
);

-- 3. La foto, por si alguno ya existía sin ella
UPDATE e SET Imagen = o.Imagen
FROM Ejercicios e
JOIN @Originales o ON o.Nombre = e.Nombre
WHERE e.UsuarioId IS NULL AND e.Imagen IS NULL AND o.Imagen IS NOT NULL;

COMMIT TRANSACTION;

SELECT
  (SELECT COUNT(*) FROM Ejercicios WHERE UsuarioId IS NULL) AS TotalEjerciciosGlobales,
  (SELECT COUNT(*) FROM Ejercicios WHERE UsuarioId IS NULL AND Imagen IS NOT NULL) AS EjerciciosConImagen;
PRINT 'Migración 09 terminada.';
GO
