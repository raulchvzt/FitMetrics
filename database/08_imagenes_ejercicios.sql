/* =====================================================================
   Migración 08: imágenes de los ejercicios
   - Imagen: carpeta con las 2 fotos del ejercicio en frontend/public/ejercicios
     (fotos de free-exercise-db, dominio público). Solo ejercicios del catálogo.
   - Foto: foto propia (data URL) para los ejercicios que crea cada usuario.
   Se puede correr más de una vez.
   Ejecutar con Autenticación de Windows.
   ===================================================================== */
USE FitMetrics;
GO

IF COL_LENGTH('Ejercicios', 'Imagen') IS NULL
    ALTER TABLE Ejercicios ADD Imagen VARCHAR(80) NULL;
GO

IF COL_LENGTH('Ejercicios', 'Foto') IS NULL
    ALTER TABLE Ejercicios ADD
        Foto VARCHAR(MAX) NULL
            CONSTRAINT CK_Ejercicios_Foto
                CHECK (Foto LIKE 'data:image/%;base64,%' AND LEN(Foto) <= 400000);
GO

-- Relación ejercicio del catálogo → carpeta de fotos
UPDATE e SET Imagen = m.Imagen
FROM Ejercicios e
JOIN (VALUES
 (N'Press de banca', 'barbell-bench-press-medium-grip'),
 (N'Press inclinado', 'incline-dumbbell-press'),
 (N'Press de banca con mancuernas', 'dumbbell-bench-press'),
 (N'Press inclinado con barra', 'barbell-incline-bench-press-medium-grip'),
 (N'Press declinado', 'decline-barbell-bench-press'),
 (N'Press de pecho en máquina', 'leverage-chest-press'),
 (N'Aperturas con mancuernas', 'dumbbell-flyes'),
 (N'Cruces en polea', 'cable-crossover'),
 (N'Pec deck', 'butterfly'),
 (N'Fondos en paralelas', 'dips-chest-version'),
 (N'Lagartijas', 'pushups'),
 (N'Dominadas', 'pullups'),
 (N'Remo con barra', 'bent-over-barbell-row'),
 (N'Jalón al pecho', 'wide-grip-lat-pulldown'),
 (N'Jalón con agarre cerrado', 'close-grip-front-lat-pulldown'),
 (N'Dominadas con agarre supino', 'chin-up'),
 (N'Remo con mancuerna', 'one-arm-dumbbell-row'),
 (N'Remo sentado en polea', 'seated-cable-rows'),
 (N'Remo en máquina', 'leverage-iso-row'),
 (N'Remo en T', 't-bar-row-with-handle'),
 (N'Pullover en polea', 'straight-arm-pulldown'),
 (N'Peso muerto', 'barbell-deadlift'),
 (N'Press militar', 'standing-military-press'),
 (N'Elevaciones laterales', 'side-lateral-raise'),
 (N'Face pull', 'face-pull'),
 (N'Press de hombro con mancuernas', 'dumbbell-shoulder-press'),
 (N'Press de hombro en máquina', 'machine-shoulder-military-press'),
 (N'Press Arnold', 'arnold-dumbbell-press'),
 (N'Elevaciones laterales en polea', 'cable-seated-lateral-raise'),
 (N'Elevaciones frontales', 'front-dumbbell-raise'),
 (N'Remo al mentón', 'upright-barbell-row'),
 (N'Pájaros con mancuernas', 'seated-bent-over-rear-delt-raise'),
 (N'Aperturas inversas en máquina', 'reverse-machine-flyes'),
 (N'Curl con barra', 'barbell-curl'),
 (N'Curl con mancuernas', 'dumbbell-bicep-curl'),
 (N'Curl martillo', 'hammer-curls'),
 (N'Curl inclinado con mancuernas', 'incline-dumbbell-curl'),
 (N'Curl predicador', 'preacher-curl'),
 (N'Curl en polea', 'standing-biceps-cable-curl'),
 (N'Curl concentrado', 'concentration-curls'),
 (N'Extensión de tríceps en polea', 'triceps-pushdown'),
 (N'Press francés', 'ez-bar-skullcrusher'),
 (N'Extensión de tríceps con cuerda', 'triceps-pushdown-rope-attachment'),
 (N'Extensión de tríceps sobre la cabeza', 'cable-rope-overhead-triceps-extension'),
 (N'Patada de tríceps', 'tricep-dumbbell-kickback'),
 (N'Press de banca con agarre cerrado', 'close-grip-barbell-bench-press'),
 (N'Fondos en banco', 'bench-dips'),
 (N'Sentadilla', 'barbell-squat'),
 (N'Prensa', 'leg-press'),
 (N'Sentadilla frontal', 'front-squat-clean-grip'),
 (N'Sentadilla hack', 'hack-squat'),
 (N'Sentadilla en Smith', 'smith-machine-squat'),
 (N'Sentadilla búlgara', 'split-squat-with-dumbbells'),
 (N'Sentadilla goblet', 'goblet-squat'),
 (N'Zancadas', 'dumbbell-lunges'),
 (N'Extensión de cuádriceps', 'leg-extensions'),
 (N'Peso muerto rumano', 'romanian-deadlift'),
 (N'Curl femoral', 'lying-leg-curls'),
 (N'Curl femoral sentado', 'seated-leg-curl'),
 (N'Curl femoral acostado', 'lying-leg-curls'),
 (N'Peso muerto rumano con mancuernas', 'stiff-legged-dumbbell-deadlift'),
 (N'Peso muerto con piernas rígidas', 'stiff-legged-barbell-deadlift'),
 (N'Buenos días', 'good-morning'),
 (N'Hip thrust', 'barbell-hip-thrust'),
 (N'Puente de glúteo', 'barbell-glute-bridge'),
 (N'Peso muerto sumo', 'sumo-deadlift'),
 (N'Patada de glúteo en polea', 'one-legged-cable-kickback'),
 (N'Abducción de cadera en máquina', 'thigh-abductor'),
 (N'Hiperextensiones', 'hyperextensions-back-extensions'),
 (N'Elevación de talones', 'standing-calf-raises'),
 (N'Elevación de talones sentado', 'seated-calf-raise'),
 (N'Elevación de talones en prensa', 'calf-press-on-the-leg-press-machine'),
 (N'Elevación de talones con mancuerna', 'standing-dumbbell-calf-raise'),
 (N'Crunch abdominal', 'crunches'),
 (N'Crunch en polea', 'cable-crunch'),
 (N'Crunch en máquina', 'ab-crunch-machine'),
 (N'Elevaciones de piernas colgado', 'hanging-leg-raise'),
 (N'Rueda abdominal', 'ab-roller')
) AS m(Nombre, Imagen) ON m.Nombre = e.Nombre
WHERE e.UsuarioId IS NULL;

SELECT COUNT(*) AS EjerciciosConImagen FROM Ejercicios WHERE Imagen IS NOT NULL;
PRINT 'Migración 08 terminada.';
GO
