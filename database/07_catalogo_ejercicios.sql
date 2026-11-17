/* =====================================================================
   Migración 07: catálogo ampliado de ejercicios
   - Agrega 65 ejercicios globales (de 14 a 79), cada uno con su músculo
     principal (factor 1.0) y sus secundarios (0.5), para que el volumen
     semanal y las sugerencias de sobrecarga funcionen con todos.
   - No toca los 14 ejercicios que ya existían ni tus series registradas.
   - Se puede correr más de una vez: solo agrega lo que falta.
   Ejecutar con Autenticación de Windows.
   ===================================================================== */
USE FitMetrics;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @Nuevos TABLE (
    Nombre NVARCHAR(100) NOT NULL PRIMARY KEY,
    Tipo NVARCHAR(20) NOT NULL,
    Equipo NVARCHAR(30) NOT NULL,
    IncrementoKg DECIMAL(4,2) NOT NULL
);

INSERT INTO @Nuevos (Nombre, Tipo, Equipo, IncrementoKg) VALUES
 -- Pecho
 (N'Press de banca con mancuernas',     'Compuesto',   N'Mancuerna',     2.0),
 (N'Press inclinado con barra',         'Compuesto',   N'Barra',         2.5),
 (N'Press declinado',                   'Compuesto',   N'Barra',         2.5),
 (N'Press de pecho en máquina',         'Compuesto',   N'Máquina',       5.0),
 (N'Aperturas con mancuernas',          'Aislamiento', N'Mancuerna',     1.0),
 (N'Cruces en polea',                   'Aislamiento', N'Polea',         2.5),
 (N'Pec deck',                          'Aislamiento', N'Máquina',       2.5),
 (N'Fondos en paralelas',               'Compuesto',   N'Peso corporal', 2.5),
 (N'Lagartijas',                        'Compuesto',   N'Peso corporal', 2.5),
 -- Espalda
 (N'Jalón al pecho',                    'Compuesto',   N'Polea',         2.5),
 (N'Jalón con agarre cerrado',          'Compuesto',   N'Polea',         2.5),
 (N'Dominadas con agarre supino',       'Compuesto',   N'Peso corporal', 2.5),
 (N'Remo con mancuerna',                'Compuesto',   N'Mancuerna',     2.0),
 (N'Remo sentado en polea',             'Compuesto',   N'Polea',         2.5),
 (N'Remo en máquina',                   'Compuesto',   N'Máquina',       5.0),
 (N'Remo en T',                         'Compuesto',   N'Barra',         2.5),
 (N'Pullover en polea',                 'Aislamiento', N'Polea',         2.5),
 (N'Peso muerto',                       'Compuesto',   N'Barra',         5.0),
 -- Hombro
 (N'Press de hombro con mancuernas',    'Compuesto',   N'Mancuerna',     2.0),
 (N'Press de hombro en máquina',        'Compuesto',   N'Máquina',       2.5),
 (N'Press Arnold',                      'Compuesto',   N'Mancuerna',     2.0),
 (N'Elevaciones laterales en polea',    'Aislamiento', N'Polea',         1.25),
 (N'Elevaciones laterales en máquina',  'Aislamiento', N'Máquina',       2.5),
 (N'Elevaciones frontales',             'Aislamiento', N'Mancuerna',     1.0),
 (N'Remo al mentón',                    'Compuesto',   N'Barra',         2.5),
 (N'Pájaros con mancuernas',            'Aislamiento', N'Mancuerna',     1.0),
 (N'Aperturas inversas en máquina',     'Aislamiento', N'Máquina',       2.5),
 -- Bíceps
 (N'Curl con mancuernas',               'Aislamiento', N'Mancuerna',     1.0),
 (N'Curl martillo',                     'Aislamiento', N'Mancuerna',     1.0),
 (N'Curl inclinado con mancuernas',     'Aislamiento', N'Mancuerna',     1.0),
 (N'Curl predicador',                   'Aislamiento', N'Barra',         1.25),
 (N'Curl en polea',                     'Aislamiento', N'Polea',         1.25),
 (N'Curl concentrado',                  'Aislamiento', N'Mancuerna',     1.0),
 -- Tríceps
 (N'Press francés',                     'Aislamiento', N'Barra',         1.25),
 (N'Extensión de tríceps con cuerda',   'Aislamiento', N'Polea',         2.5),
 (N'Extensión de tríceps sobre la cabeza','Aislamiento', N'Polea',       2.5),
 (N'Patada de tríceps',                 'Aislamiento', N'Mancuerna',     1.0),
 (N'Press de banca con agarre cerrado', 'Compuesto',   N'Barra',         2.5),
 (N'Fondos en banco',                   'Compuesto',   N'Peso corporal', 2.5),
 -- Cuádriceps
 (N'Sentadilla frontal',                'Compuesto',   N'Barra',         2.5),
 (N'Sentadilla hack',                   'Compuesto',   N'Máquina',       5.0),
 (N'Sentadilla en Smith',               'Compuesto',   N'Máquina',       2.5),
 (N'Sentadilla búlgara',                'Compuesto',   N'Mancuerna',     2.0),
 (N'Sentadilla goblet',                 'Compuesto',   N'Mancuerna',     2.0),
 (N'Zancadas',                          'Compuesto',   N'Mancuerna',     2.0),
 (N'Extensión de cuádriceps',           'Aislamiento', N'Máquina',       2.5),
 -- Isquiotibiales
 (N'Curl femoral sentado',              'Aislamiento', N'Máquina',       2.5),
 (N'Curl femoral acostado',             'Aislamiento', N'Máquina',       2.5),
 (N'Peso muerto rumano con mancuernas', 'Compuesto',   N'Mancuerna',     2.0),
 (N'Peso muerto con piernas rígidas',   'Compuesto',   N'Barra',         2.5),
 (N'Buenos días',                       'Compuesto',   N'Barra',         2.5),
 -- Glúteos
 (N'Hip thrust',                        'Compuesto',   N'Barra',         5.0),
 (N'Puente de glúteo',                  'Compuesto',   N'Barra',         2.5),
 (N'Peso muerto sumo',                  'Compuesto',   N'Barra',         5.0),
 (N'Patada de glúteo en polea',         'Aislamiento', N'Polea',         1.25),
 (N'Abducción de cadera en máquina',    'Aislamiento', N'Máquina',       2.5),
 (N'Hiperextensiones',                  'Aislamiento', N'Peso corporal', 2.5),
 -- Pantorrillas
 (N'Elevación de talones sentado',      'Aislamiento', N'Máquina',       2.5),
 (N'Elevación de talones en prensa',    'Aislamiento', N'Máquina',       5.0),
 (N'Elevación de talones con mancuerna','Aislamiento', N'Mancuerna',     2.0),
 -- Abdomen
 (N'Crunch abdominal',                  'Aislamiento', N'Peso corporal', 2.5),
 (N'Crunch en polea',                   'Aislamiento', N'Polea',         2.5),
 (N'Crunch en máquina',                 'Aislamiento', N'Máquina',       2.5),
 (N'Elevaciones de piernas colgado',    'Aislamiento', N'Peso corporal', 2.5),
 (N'Rueda abdominal',                   'Aislamiento', N'Peso corporal', 2.5);

-- Músculo principal (1.0) y secundarios (0.5)
DECLARE @Musculos TABLE (
    Ejercicio NVARCHAR(100) NOT NULL,
    Musculo NVARCHAR(50) NOT NULL,
    Factor DECIMAL(3,2) NOT NULL
);

INSERT INTO @Musculos (Ejercicio, Musculo, Factor) VALUES
 (N'Press de banca con mancuernas', N'Pecho', 1.0), (N'Press de banca con mancuernas', N'Tríceps', 0.5), (N'Press de banca con mancuernas', N'Hombro anterior', 0.5),
 (N'Press inclinado con barra', N'Pecho', 1.0), (N'Press inclinado con barra', N'Hombro anterior', 0.5), (N'Press inclinado con barra', N'Tríceps', 0.5),
 (N'Press declinado', N'Pecho', 1.0), (N'Press declinado', N'Tríceps', 0.5),
 (N'Press de pecho en máquina', N'Pecho', 1.0), (N'Press de pecho en máquina', N'Tríceps', 0.5),
 (N'Aperturas con mancuernas', N'Pecho', 1.0),
 (N'Cruces en polea', N'Pecho', 1.0),
 (N'Pec deck', N'Pecho', 1.0),
 (N'Fondos en paralelas', N'Pecho', 1.0), (N'Fondos en paralelas', N'Tríceps', 0.5), (N'Fondos en paralelas', N'Hombro anterior', 0.5),
 (N'Lagartijas', N'Pecho', 1.0), (N'Lagartijas', N'Tríceps', 0.5), (N'Lagartijas', N'Hombro anterior', 0.5),

 (N'Jalón al pecho', N'Espalda', 1.0), (N'Jalón al pecho', N'Bíceps', 0.5),
 (N'Jalón con agarre cerrado', N'Espalda', 1.0), (N'Jalón con agarre cerrado', N'Bíceps', 0.5),
 (N'Dominadas con agarre supino', N'Espalda', 1.0), (N'Dominadas con agarre supino', N'Bíceps', 0.5),
 (N'Remo con mancuerna', N'Espalda', 1.0), (N'Remo con mancuerna', N'Bíceps', 0.5), (N'Remo con mancuerna', N'Hombro posterior', 0.5),
 (N'Remo sentado en polea', N'Espalda', 1.0), (N'Remo sentado en polea', N'Bíceps', 0.5), (N'Remo sentado en polea', N'Hombro posterior', 0.5),
 (N'Remo en máquina', N'Espalda', 1.0), (N'Remo en máquina', N'Bíceps', 0.5),
 (N'Remo en T', N'Espalda', 1.0), (N'Remo en T', N'Bíceps', 0.5), (N'Remo en T', N'Hombro posterior', 0.5),
 (N'Pullover en polea', N'Espalda', 1.0),
 (N'Peso muerto', N'Espalda', 1.0), (N'Peso muerto', N'Glúteos', 0.5), (N'Peso muerto', N'Isquiotibiales', 0.5),

 (N'Press de hombro con mancuernas', N'Hombro anterior', 1.0), (N'Press de hombro con mancuernas', N'Hombro lateral', 0.5), (N'Press de hombro con mancuernas', N'Tríceps', 0.5),
 (N'Press de hombro en máquina', N'Hombro anterior', 1.0), (N'Press de hombro en máquina', N'Tríceps', 0.5),
 (N'Press Arnold', N'Hombro anterior', 1.0), (N'Press Arnold', N'Hombro lateral', 0.5), (N'Press Arnold', N'Tríceps', 0.5),
 (N'Elevaciones laterales en polea', N'Hombro lateral', 1.0),
 (N'Elevaciones laterales en máquina', N'Hombro lateral', 1.0),
 (N'Elevaciones frontales', N'Hombro anterior', 1.0),
 (N'Remo al mentón', N'Hombro lateral', 1.0), (N'Remo al mentón', N'Bíceps', 0.5),
 (N'Pájaros con mancuernas', N'Hombro posterior', 1.0),
 (N'Aperturas inversas en máquina', N'Hombro posterior', 1.0),

 (N'Curl con mancuernas', N'Bíceps', 1.0),
 (N'Curl martillo', N'Bíceps', 1.0),
 (N'Curl inclinado con mancuernas', N'Bíceps', 1.0),
 (N'Curl predicador', N'Bíceps', 1.0),
 (N'Curl en polea', N'Bíceps', 1.0),
 (N'Curl concentrado', N'Bíceps', 1.0),

 (N'Press francés', N'Tríceps', 1.0),
 (N'Extensión de tríceps con cuerda', N'Tríceps', 1.0),
 (N'Extensión de tríceps sobre la cabeza', N'Tríceps', 1.0),
 (N'Patada de tríceps', N'Tríceps', 1.0),
 (N'Press de banca con agarre cerrado', N'Tríceps', 1.0), (N'Press de banca con agarre cerrado', N'Pecho', 0.5),
 (N'Fondos en banco', N'Tríceps', 1.0), (N'Fondos en banco', N'Hombro anterior', 0.5),

 (N'Sentadilla frontal', N'Cuádriceps', 1.0), (N'Sentadilla frontal', N'Glúteos', 0.5),
 (N'Sentadilla hack', N'Cuádriceps', 1.0), (N'Sentadilla hack', N'Glúteos', 0.5),
 (N'Sentadilla en Smith', N'Cuádriceps', 1.0), (N'Sentadilla en Smith', N'Glúteos', 0.5),
 (N'Sentadilla búlgara', N'Cuádriceps', 1.0), (N'Sentadilla búlgara', N'Glúteos', 0.5),
 (N'Sentadilla goblet', N'Cuádriceps', 1.0), (N'Sentadilla goblet', N'Glúteos', 0.5),
 (N'Zancadas', N'Cuádriceps', 1.0), (N'Zancadas', N'Glúteos', 0.5),
 (N'Extensión de cuádriceps', N'Cuádriceps', 1.0),

 (N'Curl femoral sentado', N'Isquiotibiales', 1.0),
 (N'Curl femoral acostado', N'Isquiotibiales', 1.0),
 (N'Peso muerto rumano con mancuernas', N'Isquiotibiales', 1.0), (N'Peso muerto rumano con mancuernas', N'Glúteos', 0.5),
 (N'Peso muerto con piernas rígidas', N'Isquiotibiales', 1.0), (N'Peso muerto con piernas rígidas', N'Glúteos', 0.5),
 (N'Buenos días', N'Isquiotibiales', 1.0), (N'Buenos días', N'Glúteos', 0.5),

 (N'Hip thrust', N'Glúteos', 1.0), (N'Hip thrust', N'Isquiotibiales', 0.5),
 (N'Puente de glúteo', N'Glúteos', 1.0), (N'Puente de glúteo', N'Isquiotibiales', 0.5),
 (N'Peso muerto sumo', N'Glúteos', 1.0), (N'Peso muerto sumo', N'Cuádriceps', 0.5), (N'Peso muerto sumo', N'Isquiotibiales', 0.5),
 (N'Patada de glúteo en polea', N'Glúteos', 1.0),
 (N'Abducción de cadera en máquina', N'Glúteos', 1.0),
 (N'Hiperextensiones', N'Glúteos', 1.0), (N'Hiperextensiones', N'Isquiotibiales', 0.5),

 (N'Elevación de talones sentado', N'Pantorrillas', 1.0),
 (N'Elevación de talones en prensa', N'Pantorrillas', 1.0),
 (N'Elevación de talones con mancuerna', N'Pantorrillas', 1.0),

 (N'Crunch abdominal', N'Abdomen', 1.0),
 (N'Crunch en polea', N'Abdomen', 1.0),
 (N'Crunch en máquina', N'Abdomen', 1.0),
 (N'Elevaciones de piernas colgado', N'Abdomen', 1.0),
 (N'Rueda abdominal', N'Abdomen', 1.0);

-- 1. Ejercicios que todavía no existen
INSERT INTO Ejercicios (Nombre, Tipo, Equipo, IncrementoKg)
SELECT n.Nombre, n.Tipo, n.Equipo, n.IncrementoKg
FROM @Nuevos n
WHERE NOT EXISTS (SELECT 1 FROM Ejercicios e WHERE e.Nombre = n.Nombre AND e.UsuarioId IS NULL);

PRINT CONCAT('Ejercicios agregados: ', @@ROWCOUNT);

-- 2. Sus músculos (si algún nombre de músculo no coincidiera, el JOIN lo descartaría: se revisa abajo)
INSERT INTO EjercicioMusculos (EjercicioId, GrupoMuscularId, Factor)
SELECT e.EjercicioId, g.GrupoMuscularId, m.Factor
FROM @Musculos m
JOIN Ejercicios e       ON e.Nombre = m.Ejercicio AND e.UsuarioId IS NULL
JOIN GruposMusculares g ON g.Nombre = m.Musculo
WHERE NOT EXISTS (
    SELECT 1 FROM EjercicioMusculos x
    WHERE x.EjercicioId = e.EjercicioId AND x.GrupoMuscularId = g.GrupoMuscularId
);

-- 3. Revisión: todo ejercicio nuevo debe tener exactamente un músculo principal
IF EXISTS (
    SELECT 1 FROM @Nuevos n
    JOIN Ejercicios e ON e.Nombre = n.Nombre AND e.UsuarioId IS NULL
    WHERE (SELECT COUNT(*) FROM EjercicioMusculos em
           WHERE em.EjercicioId = e.EjercicioId AND em.Factor = 1.0) <> 1
)
BEGIN
    ROLLBACK TRANSACTION;
    THROW 50070, 'Algún ejercicio quedó sin músculo principal. No se aplicó ningún cambio.', 1;
END

COMMIT TRANSACTION;

SELECT COUNT(*) AS TotalEjerciciosGlobales FROM Ejercicios WHERE UsuarioId IS NULL;
PRINT 'Migración 07 terminada.';
GO
