// Secciones del catálogo de ejercicios según su músculo principal (factor 1.0).
// Los tres grupos de hombro se muestran juntos en "Hombro".
export const SECCIONES = [
  { id: 'pecho', etiqueta: 'Pecho', musculos: ['Pecho'] },
  { id: 'espalda', etiqueta: 'Espalda', musculos: ['Espalda'] },
  { id: 'hombro', etiqueta: 'Hombro', musculos: ['Hombro anterior', 'Hombro lateral', 'Hombro posterior'] },
  { id: 'biceps', etiqueta: 'Bíceps', musculos: ['Bíceps'] },
  { id: 'triceps', etiqueta: 'Tríceps', musculos: ['Tríceps'] },
  { id: 'cuadriceps', etiqueta: 'Cuádriceps', musculos: ['Cuádriceps'] },
  { id: 'isquios', etiqueta: 'Isquiotibiales', musculos: ['Isquiotibiales'] },
  { id: 'gluteos', etiqueta: 'Glúteos', musculos: ['Glúteos'] },
  { id: 'pantorrillas', etiqueta: 'Pantorrillas', musculos: ['Pantorrillas'] },
  { id: 'abdomen', etiqueta: 'Abdomen', musculos: ['Abdomen'] }
];

const OTROS = { id: 'otros', etiqueta: 'Otros', musculos: [] };

const SECCION_POR_MUSCULO = new Map(
  SECCIONES.flatMap((s) => s.musculos.map((m) => [m, s.id]))
);

export function seccionDe(ejercicio) {
  const principal = ejercicio.musculos.find((m) => Number(m.factor) === 1) ?? ejercicio.musculos[0];
  return SECCION_POR_MUSCULO.get(principal?.nombre) ?? OTROS.id;
}

// Agrupa una lista de ejercicios en secciones, en el orden de SECCIONES
export function agruparPorSeccion(ejercicios) {
  const grupos = new Map([...SECCIONES, OTROS].map((s) => [s.id, { ...s, ejercicios: [] }]));
  for (const e of ejercicios) grupos.get(seccionDe(e)).ejercicios.push(e);
  for (const g of grupos.values()) g.ejercicios.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return [...grupos.values()].filter((g) => g.ejercicios.length > 0);
}
