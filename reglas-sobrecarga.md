# Reglas del motor de sobrecarga progresiva

FitMetrics sugiere el peso y las repeticiones de cada ejercicio usando **doble progresión**: primero subes repeticiones dentro de tu rango y, cuando las completas, subes el peso y regresas al mínimo del rango.

Las sugerencias son orientativas: nunca cambian tu rutina de forma automática. Las calcula `backend/src/utils/sobrecarga.js` y sus pruebas están en `sobrecarga.test.js` (`npm test` en `backend`).

## Datos que usa

- **Objetivo de la rutina**: series, rango de repeticiones (`repsMin`–`repsMax`) y RIR objetivo.
- **Última sesión terminada** con ese ejercicio: solo las series de trabajo (sin calentamiento) **con el peso más alto** de esa sesión.
- **Incremento del ejercicio** (`Ejercicios.IncrementoKg`): el salto mínimo de carga, por ejemplo 2.5 kg en barra o 1 kg en mancuernas pequeñas.

## Reglas, en orden

| # | Situación en la última sesión | Sugerencia |
|---|---|---|
| 1 | No hay historial del ejercicio | **Primera vez**: elegir un peso que permita hacer `repsMin`–`repsMax` reps con el RIR objetivo |
| 2 | Hizo todas las series del objetivo y **todas** llegaron a `repsMax` | **Subir** el peso un incremento y volver a `repsMin` |
| 3 | El RIR promedio fue **2 o más por encima** del objetivo y todas las series llegaron al menos a `repsMin` | **Subir** el peso un incremento (el peso le quedó ligero) |
| 4 | **Ninguna** serie llegó a `repsMin` | **Bajar** el peso un incremento y apuntar a `repsMin` |
| 5 | Cualquier otro caso (dentro del rango) | **Mantener** el peso y buscar una repetición más que la peor serie, sin pasar de `repsMax` |

Notas:

- La regla 4 usa la **mejor** serie y no la peor: que la última serie quede corta por fatiga es normal y no es motivo para bajar el peso.
- En ejercicios con peso corporal (peso 0) nunca se sugiere un peso negativo; si no llega al mínimo, se recomienda usar asistencia.

## Unidades

La sugerencia se calcula en la unidad del usuario. En libras, el incremento se convierte y se redondea a múltiplos de 2.5 lb: 2.5 kg → 5 lb, 1.25 kg → 2.5 lb, 5 kg → 10 lb.

## Alerta de estancamiento

Se toma el mejor 1RM estimado (fórmula de Epley) de cada una de las últimas 4 sesiones del ejercicio. Si el mejor de las 3 más recientes **no supera** al de la cuarta, se muestra una alerta que sugiere una semana de descarga o revisar el descanso.

## Series efectivas

Una serie cuenta como efectiva para el volumen semanal si **no es de calentamiento** y su **RIR es 3 o menos**. Los músculos secundarios de un ejercicio suman 0.5 series.