# Reglas de la sobrecarga progresiva

FitMetrics sugiere el peso y las repeticiones de cada ejercicio con **doble progresión**:
primero subes repeticiones dentro de un rango y, cuando lo completas, subes el peso y
vuelves al mínimo del rango.

El código está en [`backend/src/utils/sobrecarga.js`](../backend/src/utils/sobrecarga.js)
y sus pruebas en [`sobrecarga.test.js`](../backend/src/utils/sobrecarga.test.js).

## Datos que usa

- **El objetivo de la rutina** para ese ejercicio: series, rango de repeticiones
  (por ejemplo, 6–10) y RIR objetivo.
- **Tus últimas 4 sesiones terminadas** de ese ejercicio.
- **El salto de peso del ejercicio** (`IncrementoKg`): 2.5 kg en una barra, 1 kg en
  mancuernas pequeñas, 5 kg en una prensa. En libras se redondea a múltiplos de 2.5
  (2.5 kg → 5 lb).

De la última sesión toma el **peso más alto** que usaste y solo las series hechas con ese peso.

## Las reglas, en orden

| # | Situación | Sugerencia |
|---|---|---|
| 1 | Nunca has hecho el ejercicio | **Inicial:** elige un peso con el que hagas el rango dejando tu RIR objetivo en reserva |
| 2 | Hiciste todas las series y **todas llegaron al máximo** del rango | **Subir** el peso un salto y volver al mínimo de repeticiones |
| 3 | Te sobraron repeticiones: tu RIR promedio fue **2 o más arriba** del objetivo y llegaste al mínimo | **Subir** el peso un salto |
| 4 | **Ninguna serie** llegó al mínimo del rango | **Bajar** el peso un salto (en ejercicios con tu peso corporal sugiere usar asistencia) |
| 5 | Cualquier otro caso | **Mantener** el peso y buscar **una repetición más** que tu serie más baja (sin pasar del máximo) |

### Ejemplo

Press de banca, objetivo 3 × 6–10, RIR 2, salto de 2.5 kg:

| Última sesión con 80 kg | Sugerencia de hoy |
|---|---|
| 10, 10, 10 reps | Subir a **82.5 kg × 6** |
| 9, 8, 8 reps | Mantener **80 kg** y buscar **9** reps |
| 5, 4, 4 reps | Bajar a **77.5 kg** |

## Alerta de estancamiento

Además de la sugerencia, la app avisa si estás **estancado**: cuando tu mejor
**1RM estimado** de las últimas 3 sesiones no supera al de la sesión anterior a esas.
Es una señal para cambiar algo: dormir mejor, hacer una semana de descarga o
cambiar la variante del ejercicio.

## Conceptos

- **RIR** (*repeticiones en reserva*): cuántas repeticiones más podías hacer.
  RIR 2 = te quedaban 2. La app calcula el **RPE** como `10 − RIR`.
- **Serie efectiva**: una serie de trabajo (no de calentamiento) con **RIR de 3 o menos**.
  Son las que cuentan para el volumen semanal.
- **Volumen por músculo**: cada serie efectiva suma **1** al músculo principal del
  ejercicio y **0.5** a los secundarios. Por ejemplo, el press de banca suma 1 a pecho
  y 0.5 a tríceps y hombro anterior.
- **1RM estimado** (fórmula de Epley): `peso × (1 + reps / 30)`.
  80 kg × 10 reps ≈ 106.7 kg.

Estas tres columnas (`RPE`, `EsEfectiva` y `E1RM`) se calculan en la propia tabla
`Series` de SQL Server como columnas calculadas persistidas.
