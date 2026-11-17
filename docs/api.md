# API de FitMetrics

API REST en Express. Todas las rutas empiezan con `/api` y responden JSON
(excepto los reportes, que descargan un archivo).

## Autenticación

Inicia sesión con `POST /api/auth/login` y usa el token que devuelve en cada petición:

```http
Authorization: Bearer <token>
```

El token es un JWT firmado con HS256 que dura 30 días (`JWT_EXPIRES_IN`).
Todas las rutas lo piden, salvo las marcadas como **pública**.

## Errores

Siempre con el mismo formato y el mensaje en español:

```json
{ "error": "Correo o contraseña incorrectos" }
```

| Código | Cuándo |
|---|---|
| `400` | Datos inválidos |
| `401` | Sin token, token vencido o credenciales incorrectas |
| `404` | El recurso no existe o no es tuyo |
| `409` | Conflicto (correo ya registrado, toma ya registrada hoy, etc.) |
| `413` | El cuerpo pesa más de 512 KB |
| `429` | Demasiados intentos (ver [límites](#límites-de-peticiones)) |

## Unidades y fechas

- Los pesos se guardan en **kg** y se devuelven en la unidad del usuario (`kg` o `lb`).
  Al registrar una serie puedes mandar `unidad` para capturar en la otra.
- Las fechas se guardan en **UTC** y los cálculos por día y semana usan la hora de México.

---

## Cuenta — `/api/auth`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/registro` | Crea una cuenta y devuelve `{ token, usuario }`. **Pública** |
| `POST` | `/login` | Inicia sesión y devuelve `{ token, usuario }`. **Pública** |
| `GET` | `/perfil` | Datos del usuario, incluida su foto |
| `PUT` | `/perfil` | Cambia `nombre`, `unidadPeso` o `pesoCorporal` |
| `PUT` | `/perfil/foto` | Sube la foto de perfil (`{ foto: "data:image/jpeg;base64,..." }`) |
| `DELETE` | `/perfil/foto` | Quita la foto de perfil |
| `PUT` | `/password` | Cambia la contraseña (`{ actual, nueva }`) |

## Ejercicios — `/api/ejercicios`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Catálogo (79 ejercicios) más los ejercicios propios, con músculos y fotos |
| `GET` | `/grupos` | Los 12 grupos musculares |
| `POST` | `/` | Crea un ejercicio propio (`nombre`, `equipo`, `principal`, `secundarios`, `incrementoKg`) |
| `PUT` | `/:id` | Edita un ejercicio propio |
| `DELETE` | `/:id` | Borra un ejercicio propio si no tiene series ni está en rutinas |
| `PUT` | `/:id/foto` | Foto de un ejercicio propio |
| `DELETE` | `/:id/foto` | Quita esa foto |

## Rutinas — `/api/rutinas`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Tus rutinas con totales de ejercicios y series |
| `GET` | `/:id` | Una rutina con sus ejercicios en orden |
| `POST` | `/` | Crea una rutina (`nombre`, `descripcion`, `ejercicios[]`) |
| `PUT` | `/:id` | Reemplaza la rutina |
| `DELETE` | `/:id` | Desactiva la rutina (el historial se conserva) |
| `PUT` | `/:id/foto` | Foto propia de la rutina |
| `DELETE` | `/:id/foto` | Vuelve a la foto aleatoria |

## Entrenamientos — `/api/sesiones`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/?pagina=1&limite=20` | Historial de sesiones terminadas |
| `GET` | `/activa` | La sesión en curso (o `null`), con el plan y las **sugerencias de sobrecarga** |
| `GET` | `/:id` | Detalle de una sesión |
| `POST` | `/` | Empieza una sesión (`{ rutinaId }` o sin rutina) |
| `DELETE` | `/:id` | Cancela la sesión en curso |
| `POST` | `/:id/series` | Registra una serie (`ejercicioId`, `peso`, `reps`, `rir`, `esCalentamiento`) |
| `DELETE` | `/:id/series/:serieId` | Borra una serie |
| `POST` | `/:id/finalizar` | Termina la sesión (`{ fatigaPercibida }` de 1 a 10) |

## Progreso — `/api/progreso`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/volumen?semana=AAAA-MM-DD` | Series efectivas por músculo en una semana, contra la anterior |
| `GET` | `/ejercicios` | Ejercicios con peso registrado (para la gráfica de fuerza) |
| `GET` | `/fuerza/:ejercicioId?dias=90` | Mejor 1RM estimado por sesión (`dias`: 30, 90, 180, 365 o 0 = todo) |
| `GET` | `/objetivos` | Rango de series semanales de cada músculo |
| `PUT` | `/objetivos` | Guarda rangos personalizados |
| `DELETE` | `/objetivos` | Vuelve a los rangos por defecto (10–20) |

## Suplementos — `/api/suplementos`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Tus suplementos con stock, días restantes y si están pendientes hoy |
| `GET` | `/catalogo` | Los 21 suplementos comunes con su dosis típica |
| `POST` | `/` | Agrega un suplemento (con `catalogo` opcional) |
| `GET` | `/:id` | Un suplemento |
| `PUT` | `/:id` | Edita un suplemento |
| `DELETE` | `/:id` | Lo desactiva (el historial se conserva) |
| `POST` | `/:id/tomas` | Registra la toma de hoy y descuenta la dosis del stock |
| `DELETE` | `/:id/tomas/hoy` | Deshace la toma de hoy |
| `POST` | `/:id/compras` | Suma una compra al stock |
| `PUT` | `/:id/stock` | Corrige el stock a mano |
| `GET` | `/:id/movimientos` | Últimos 30 movimientos del inventario |
| `PUT` | `/:id/foto` | Foto del bote |
| `DELETE` | `/:id/foto` | Vuelve a la ilustración |

## Reportes — `/api/reportes`

`dias` puede ser 30, 90, 180 o 365.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/resumen?dias=30` | Datos del dashboard: totales, comparación, evolución, frecuencia, ejercicios, músculos y suplementos |
| `GET` | `/pdf?dias=30` | Descarga el reporte en PDF |
| `GET` | `/csv?tipo=series&dias=30` | Descarga un CSV (`tipo`: `series`, `sesiones` o `suplementos`) |

## Salud — `/api/health`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | `{ estado: "ok", baseDatos: "conectada" }` si la API y SQL Server responden. **Pública** |

---

## Límites de peticiones

| Qué | Límite |
|---|---|
| Login | 10 intentos cada 15 min por conexión **y** correo |
| Registro | 5 cuentas por hora por conexión |
| Cambiar contraseña | 5 intentos cada 15 min por usuario |
| Toda la API | 300 peticiones por minuto por conexión |

Las respuestas incluyen los encabezados `RateLimit` y `RateLimit-Policy`,
que indican cuántos intentos quedan.
