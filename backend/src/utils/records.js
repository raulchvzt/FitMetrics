import { desdeKg } from './unidades.js';

// Un récord es superar el mejor 1RM estimado de sesiones anteriores.
// La primera vez que haces un ejercicio no cuenta como récord (no hay con qué comparar).
export function recordsNuevos(mejores, unidad) {
  return mejores
    .filter((m) => m.anterior !== null && Number(m.mejor) > Number(m.anterior))
    .map((m) => ({
      ejercicioId: m.ejercicioId,
      nombre: m.nombre,
      e1rm: desdeKg(Number(m.mejor), unidad),
      mejora: desdeKg(Number(m.mejor) - Number(m.anterior), unidad)
    }))
    .sort((a, b) => b.mejora - a.mejora);
}
