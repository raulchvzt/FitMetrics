/* =====================================================================
   FitMetrics — Paso 1: Base de datos (SQL Server)
   Cubre los 4 módulos: Volumen (A), Sobrecarga (B),
   Suplementos (C) y Analítica (D).
   Ejecutar completo en SSMS o Azure Data Studio.
   ===================================================================== */

IF DB_ID('FitMetrics') IS NULL
    CREATE DATABASE FitMetrics;
GO
USE FitMetrics;
GO

/* ---------------------------------------------------------------------
   1. USUARIOS
   --------------------------------------------------------------------- */
CREATE TABLE Usuarios (
    UsuarioId       INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100)  NOT NULL,
    Email           NVARCHAR(150)  NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(255)  NOT NULL,          -- bcrypt desde el backend
    PesoCorporalKg  DECIMAL(5,2)   NULL,
    UnidadPeso      CHAR(2)        NOT NULL DEFAULT 'kg'
                    CHECK (UnidadPeso IN ('kg','lb')),
    FechaRegistro   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    Activo          BIT            NOT NULL DEFAULT 1
);

/* ---------------------------------------------------------------------
   2. CATÁLOGO DE EJERCICIOS (Módulo A)
   --------------------------------------------------------------------- */
CREATE TABLE GruposMusculares (
    GrupoMuscularId INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Ejercicios (
    EjercicioId     INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL,
    Tipo            NVARCHAR(20)  NOT NULL
                    CHECK (Tipo IN ('Compuesto','Aislamiento')),
    Equipo          NVARCHAR(30)  NULL,               -- Barra, Mancuerna, Máquina, Polea...
    IncrementoKg    DECIMAL(4,2)  NOT NULL DEFAULT 2.5, -- salto mínimo de carga (Módulo B)
    UsuarioId       INT NULL REFERENCES Usuarios(UsuarioId), -- NULL = ejercicio global
    CONSTRAINT UQ_Ejercicio UNIQUE (Nombre, UsuarioId)
);

-- Músculo primario cuenta 1.0 serie, secundario 0.5
CREATE TABLE EjercicioMusculos (
    EjercicioId     INT NOT NULL REFERENCES Ejercicios(EjercicioId) ON DELETE CASCADE,
    GrupoMuscularId INT NOT NULL REFERENCES GruposMusculares(GrupoMuscularId),
    Factor          DECIMAL(3,2) NOT NULL CHECK (Factor IN (1.00, 0.50)),
    PRIMARY KEY (EjercicioId, GrupoMuscularId)
);

-- Rango objetivo de series efectivas por semana (ej. 10–20)
CREATE TABLE ObjetivosVolumen (
    UsuarioId       INT NOT NULL REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    GrupoMuscularId INT NOT NULL REFERENCES GruposMusculares(GrupoMuscularId),
    SeriesMin       TINYINT NOT NULL DEFAULT 10,
    SeriesMax       TINYINT NOT NULL DEFAULT 20,
    PRIMARY KEY (UsuarioId, GrupoMuscularId),
    CHECK (SeriesMax >= SeriesMin)
);

/* ---------------------------------------------------------------------
   3. PERIODIZACIÓN Y RUTINAS (Módulo B)
   --------------------------------------------------------------------- */
CREATE TABLE BloquesPeriodizacion (
    BloqueId        INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    Nombre          NVARCHAR(100) NOT NULL,
    Tipo            NVARCHAR(20)  NOT NULL
                    CHECK (Tipo IN ('Acumulacion','Intensificacion','Descarga')),
    FechaInicio     DATE NOT NULL,
    FechaFin        DATE NULL,
    Activo          BIT  NOT NULL DEFAULT 1
);

CREATE TABLE Rutinas (
    RutinaId        INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    Nombre          NVARCHAR(100) NOT NULL,           -- ej. "Torso A", "Pierna B"
    Descripcion     NVARCHAR(300) NULL,
    FechaCreacion   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    Activa          BIT NOT NULL DEFAULT 1
);

CREATE TABLE RutinaEjercicios (
    RutinaEjercicioId INT IDENTITY(1,1) PRIMARY KEY,
    RutinaId        INT NOT NULL REFERENCES Rutinas(RutinaId) ON DELETE CASCADE,
    EjercicioId     INT NOT NULL REFERENCES Ejercicios(EjercicioId),
    Orden           TINYINT NOT NULL,
    SeriesObjetivo  TINYINT NOT NULL DEFAULT 3,
    RepsMin         TINYINT NOT NULL DEFAULT 8,
    RepsMax         TINYINT NOT NULL DEFAULT 12,      -- doble progresión
    RIRObjetivo     TINYINT NOT NULL DEFAULT 2 CHECK (RIRObjetivo <= 5),
    DescansoSeg     SMALLINT NOT NULL DEFAULT 120,
    CHECK (RepsMax >= RepsMin)
);

/* ---------------------------------------------------------------------
   4. SESIONES Y SERIES (núcleo de A, B y D)
   --------------------------------------------------------------------- */
CREATE TABLE Sesiones (
    SesionId        INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    RutinaId        INT NULL REFERENCES Rutinas(RutinaId),
    BloqueId        INT NULL REFERENCES BloquesPeriodizacion(BloqueId),
    FechaInicio     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FechaFin        DATETIME2 NULL,                   -- NULL = sesión en curso
    FatigaPercibida TINYINT NULL CHECK (FatigaPercibida BETWEEN 1 AND 10),
    Notas           NVARCHAR(500) NULL
);

CREATE TABLE Series (
    SerieId         INT IDENTITY(1,1) PRIMARY KEY,
    SesionId        INT NOT NULL REFERENCES Sesiones(SesionId) ON DELETE CASCADE,
    EjercicioId     INT NOT NULL REFERENCES Ejercicios(EjercicioId),
    NumeroSerie     TINYINT NOT NULL,
    PesoKg          DECIMAL(6,2) NOT NULL CHECK (PesoKg >= 0),
    Reps            TINYINT NOT NULL CHECK (Reps > 0),
    RIR             TINYINT NULL CHECK (RIR <= 10),
    EsCalentamiento BIT NOT NULL DEFAULT 0,
    FechaRegistro   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    -- Columnas calculadas
    RPE AS (CASE WHEN RIR IS NULL THEN NULL ELSE 10 - RIR END) PERSISTED,
    EsEfectiva AS (CASE WHEN EsCalentamiento = 0 AND RIR IS NOT NULL AND RIR <= 3
                        THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END) PERSISTED,
    -- 1RM estimado (Epley)
    E1RM AS (CAST(PesoKg * (1 + Reps / 30.0) AS DECIMAL(7,2))) PERSISTED
);

CREATE INDEX IX_Series_Sesion    ON Series(SesionId);
CREATE INDEX IX_Series_Ejercicio ON Series(EjercicioId, FechaRegistro);
CREATE INDEX IX_Sesiones_Usuario ON Sesiones(UsuarioId, FechaInicio);

/* ---------------------------------------------------------------------
   5. INVENTARIO DE SUPLEMENTOS (Módulo C)
   --------------------------------------------------------------------- */
CREATE TABLE Suplementos (
    SuplementoId    INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    Nombre          NVARCHAR(100) NOT NULL,           -- Creatina, Proteína, Pre-workout
    Unidad          NVARCHAR(20)  NOT NULL,           -- g, scoop, cápsula
    DosisPorToma    DECIMAL(7,2)  NOT NULL CHECK (DosisPorToma > 0),
    Frecuencia      NVARCHAR(20)  NOT NULL
                    CHECK (Frecuencia IN ('Diario','DiaEntreno')),
    StockActual     DECIMAL(9,2)  NOT NULL DEFAULT 0,
    DiasAlerta      TINYINT       NOT NULL DEFAULT 7, -- avisar cuando queden ≤ N días
    Activo          BIT NOT NULL DEFAULT 1
);

CREATE TABLE MovimientosInventario (
    MovimientoId    INT IDENTITY(1,1) PRIMARY KEY,
    SuplementoId    INT NOT NULL REFERENCES Suplementos(SuplementoId) ON DELETE CASCADE,
    Tipo            NVARCHAR(10) NOT NULL CHECK (Tipo IN ('Compra','Consumo','Ajuste')),
    Cantidad        DECIMAL(9,2) NOT NULL,            -- positiva en compra, negativa en consumo
    SesionId        INT NULL REFERENCES Sesiones(SesionId),
    Fecha           DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    Nota            NVARCHAR(200) NULL
);
GO

/* ---------------------------------------------------------------------
   6. VISTAS
   --------------------------------------------------------------------- */

-- Módulo A: series efectivas ponderadas por músculo y semana (lunes a domingo)
CREATE VIEW vw_VolumenSemanal AS
SELECT
    se.UsuarioId,
    DATEADD(DAY, -(DATEDIFF(DAY, '19000101', se.FechaInicio) % 7),
            CAST(se.FechaInicio AS DATE))          AS SemanaInicio,
    gm.GrupoMuscularId,
    gm.Nombre                                       AS GrupoMuscular,
    SUM(em.Factor)                                  AS SeriesEfectivas
FROM Series s
JOIN Sesiones se          ON se.SesionId = s.SesionId
JOIN EjercicioMusculos em ON em.EjercicioId = s.EjercicioId
JOIN GruposMusculares gm  ON gm.GrupoMuscularId = em.GrupoMuscularId
WHERE s.EsEfectiva = 1
GROUP BY se.UsuarioId,
         DATEADD(DAY, -(DATEDIFF(DAY, '19000101', se.FechaInicio) % 7),
                 CAST(se.FechaInicio AS DATE)),
         gm.GrupoMuscularId, gm.Nombre;
GO

-- Módulo D: mejor 1RM estimado por ejercicio y día
CREATE VIEW vw_E1RMDiario AS
SELECT
    se.UsuarioId,
    s.EjercicioId,
    e.Nombre                     AS Ejercicio,
    CAST(se.FechaInicio AS DATE) AS Fecha,
    MAX(s.E1RM)                  AS MejorE1RM
FROM Series s
JOIN Sesiones se  ON se.SesionId = s.SesionId
JOIN Ejercicios e ON e.EjercicioId = s.EjercicioId
WHERE s.EsCalentamiento = 0
GROUP BY se.UsuarioId, s.EjercicioId, e.Nombre, CAST(se.FechaInicio AS DATE);
GO

-- Módulo C: días restantes de cada suplemento
CREATE VIEW vw_EstadoSuplementos AS
SELECT
    SuplementoId, UsuarioId, Nombre, Unidad, StockActual, DosisPorToma, Frecuencia,
    CAST(StockActual / DosisPorToma AS DECIMAL(9,1)) AS TomasRestantes,
    CAST(CASE WHEN Frecuencia = 'Diario' THEN StockActual / DosisPorToma
              ELSE StockActual / DosisPorToma * 7 / 4.0   -- supone 4 entrenos/semana
         END AS DECIMAL(9,1))                         AS DiasRestantes,
    CASE WHEN (CASE WHEN Frecuencia = 'Diario' THEN StockActual / DosisPorToma
                    ELSE StockActual / DosisPorToma * 7 / 4.0 END) <= DiasAlerta
         THEN 1 ELSE 0 END                            AS RequiereReposicion
FROM Suplementos
WHERE Activo = 1;
GO

/* ---------------------------------------------------------------------
   7. PROCEDIMIENTO: cerrar sesión y descontar suplementos (Módulo C)
   --------------------------------------------------------------------- */
CREATE PROCEDURE sp_FinalizarSesion
    @SesionId INT,
    @FatigaPercibida TINYINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRAN;

    DECLARE @UsuarioId INT;
    SELECT @UsuarioId = UsuarioId FROM Sesiones WHERE SesionId = @SesionId AND FechaFin IS NULL;

    IF @UsuarioId IS NULL
    BEGIN
        ROLLBACK;
        THROW 50001, 'La sesión no existe o ya fue finalizada.', 1;
    END

    UPDATE Sesiones
    SET FechaFin = SYSDATETIME(), FatigaPercibida = @FatigaPercibida
    WHERE SesionId = @SesionId;

    -- Registrar consumo de suplementos de día de entreno
    INSERT INTO MovimientosInventario (SuplementoId, Tipo, Cantidad, SesionId, Nota)
    SELECT SuplementoId, 'Consumo', -DosisPorToma, @SesionId, 'Descuento automático por sesión'
    FROM Suplementos
    WHERE UsuarioId = @UsuarioId AND Activo = 1 AND Frecuencia = 'DiaEntreno'
      AND StockActual >= DosisPorToma;

    UPDATE Suplementos
    SET StockActual = StockActual - DosisPorToma
    WHERE UsuarioId = @UsuarioId AND Activo = 1 AND Frecuencia = 'DiaEntreno'
      AND StockActual >= DosisPorToma;

    COMMIT;
END;
GO

/* ---------------------------------------------------------------------
   8. DATOS INICIALES
   --------------------------------------------------------------------- */
INSERT INTO GruposMusculares (Nombre) VALUES
 (N'Pecho'),(N'Espalda'),(N'Hombro anterior'),(N'Hombro lateral'),(N'Hombro posterior'),
 (N'Bíceps'),(N'Tríceps'),(N'Cuádriceps'),(N'Isquiotibiales'),(N'Glúteos'),
 (N'Pantorrillas'),(N'Abdomen');

INSERT INTO Ejercicios (Nombre, Tipo, Equipo, IncrementoKg) VALUES
 (N'Press de banca',          'Compuesto',   N'Barra',     2.5),
 (N'Press inclinado',         'Compuesto',   N'Mancuerna', 2.0),
 (N'Dominadas',               'Compuesto',   N'Peso corporal', 2.5),
 (N'Remo con barra',          'Compuesto',   N'Barra',     2.5),
 (N'Press militar',           'Compuesto',   N'Barra',     2.5),
 (N'Elevaciones laterales',   'Aislamiento', N'Mancuerna', 1.0),
 (N'Face pull',               'Aislamiento', N'Polea',     2.5),
 (N'Curl con barra',          'Aislamiento', N'Barra',     1.25),
 (N'Extensión de tríceps en polea','Aislamiento', N'Polea', 2.5),
 (N'Sentadilla',              'Compuesto',   N'Barra',     2.5),
 (N'Peso muerto rumano',      'Compuesto',   N'Barra',     2.5),
 (N'Prensa',                  'Compuesto',   N'Máquina',   5.0),
 (N'Curl femoral',            'Aislamiento', N'Máquina',   2.5),
 (N'Elevación de talones',    'Aislamiento', N'Máquina',   5.0);

-- Mapeo músculo primario (1.0) / secundario (0.5)
INSERT INTO EjercicioMusculos (EjercicioId, GrupoMuscularId, Factor)
SELECT e.EjercicioId, g.GrupoMuscularId, m.Factor
FROM (VALUES
 (N'Press de banca', N'Pecho', 1.0), (N'Press de banca', N'Tríceps', 0.5), (N'Press de banca', N'Hombro anterior', 0.5),
 (N'Press inclinado', N'Pecho', 1.0), (N'Press inclinado', N'Hombro anterior', 0.5), (N'Press inclinado', N'Tríceps', 0.5),
 (N'Dominadas', N'Espalda', 1.0), (N'Dominadas', N'Bíceps', 0.5),
 (N'Remo con barra', N'Espalda', 1.0), (N'Remo con barra', N'Bíceps', 0.5), (N'Remo con barra', N'Hombro posterior', 0.5),
 (N'Press militar', N'Hombro anterior', 1.0), (N'Press militar', N'Tríceps', 0.5), (N'Press militar', N'Hombro lateral', 0.5),
 (N'Elevaciones laterales', N'Hombro lateral', 1.0),
 (N'Face pull', N'Hombro posterior', 1.0),
 (N'Curl con barra', N'Bíceps', 1.0),
 (N'Extensión de tríceps en polea', N'Tríceps', 1.0),
 (N'Sentadilla', N'Cuádriceps', 1.0), (N'Sentadilla', N'Glúteos', 0.5),
 (N'Peso muerto rumano', N'Isquiotibiales', 1.0), (N'Peso muerto rumano', N'Glúteos', 0.5),
 (N'Prensa', N'Cuádriceps', 1.0), (N'Prensa', N'Glúteos', 0.5),
 (N'Curl femoral', N'Isquiotibiales', 1.0),
 (N'Elevación de talones', N'Pantorrillas', 1.0)
) AS m(Ejercicio, Musculo, Factor)
JOIN Ejercicios e       ON e.Nombre = m.Ejercicio AND e.UsuarioId IS NULL
JOIN GruposMusculares g ON g.Nombre = m.Musculo;
GO

PRINT 'FitMetrics: base de datos creada correctamente.';