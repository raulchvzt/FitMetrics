export const UNIDADES = ['g', 'scoop', 'cápsula', 'tableta', 'ml'];

export const FRECUENCIAS = [
  { valor: 'Diario', etiqueta: 'Todos los días' },
  { valor: 'DiaEntreno', etiqueta: 'Días de entreno' }
];

export const MOMENTOS = [
  { valor: 'Cualquiera', etiqueta: 'Cualquier momento' },
  { valor: 'AntesEntrenar', etiqueta: 'Antes de entrenar' },
  { valor: 'DespuesEntrenar', etiqueta: 'Después de entrenar' }
];

const cantidad = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

// "5 g", "1 scoop", "2 cápsulas"
export function formatoCantidad(valor, unidad) {
  const plural = valor !== 1 && unidad !== 'g' && unidad !== 'ml' ? 's' : '';
  return `${cantidad.format(valor)} ${unidad}${plural}`;
}

export function descripcionToma({ dosis, unidad, frecuencia, momento }) {
  const partes = [
    formatoCantidad(dosis, unidad),
    FRECUENCIAS.find((f) => f.valor === frecuencia)?.etiqueta.toLowerCase()
  ];
  if (momento !== 'Cualquiera') {
    partes.push(MOMENTOS.find((m) => m.valor === momento)?.etiqueta.toLowerCase());
  }
  return partes.join(' · ');
}

// Acepta lo que escribe el usuario en un campo decimal ("2,5" → "2.5")
export function limpiarDecimal(texto) {
  const limpio = texto.replace(',', '.');
  return /^\d*\.?\d{0,2}$/.test(limpio) ? limpio : null;
}
// Secciones del catálogo (el backend manda "seccion" en cada suplemento)
export const SECCIONES = [
  { id: 'rendimiento', etiqueta: 'Rendimiento' },
  { id: 'proteina', etiqueta: 'Proteína' },
  { id: 'recuperacion', etiqueta: 'Recuperación' },
  { id: 'salud', etiqueta: 'Salud' },
  { id: 'otros', etiqueta: 'Otros' }
];

export function agruparPorSeccion(lista) {
  return SECCIONES
    .map((s) => ({ ...s, suplementos: lista.filter((x) => (x.seccion ?? 'otros') === s.id) }))
    .filter((g) => g.suplementos.length > 0);
}

// Para la vista previa del formulario, antes de guardar
const ILUSTRACION_POR_UNIDAD = { g: 'polvo', scoop: 'polvo', 'cápsula': 'capsulas', tableta: 'tabletas', ml: 'liquido' };

export function ilustracionPara({ catalogo, unidad }, catalogoLista = []) {
  return catalogoLista.find((c) => c.id === catalogo)?.ilustracion ?? ILUSTRACION_POR_UNIDAD[unidad] ?? 'polvo';
}
