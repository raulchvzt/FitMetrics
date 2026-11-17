// Suplementos comunes para elegir en lugar de escribirlos a mano.
// Las dosis son las típicas de etiqueta: el usuario siempre puede cambiarlas.
// "ilustracion" decide el dibujo que se muestra (bote con scoop, cápsulas, etc.).

export const SECCIONES_SUPLEMENTO = [
  { id: 'rendimiento', etiqueta: 'Rendimiento' },
  { id: 'proteina', etiqueta: 'Proteína' },
  { id: 'recuperacion', etiqueta: 'Recuperación' },
  { id: 'salud', etiqueta: 'Salud' }
];

const s = (id, nombre, seccion, unidad, dosis, frecuencia, momento, ilustracion, nota) =>
  ({ id, nombre, seccion, unidad, dosis, frecuencia, momento, ilustracion, nota });

export const CATALOGO_SUPLEMENTOS = [
  // Rendimiento
  s('creatina', 'Creatina monohidratada', 'rendimiento', 'g', 5, 'Diario', 'Cualquiera', 'polvo',
    'Funciona por acumulación: tómala todos los días, entrenes o no.'),
  s('preentreno', 'Pre-workout', 'rendimiento', 'scoop', 1, 'DiaEntreno', 'AntesEntrenar', 'polvo',
    'Unos 20–30 minutos antes de entrenar.'),
  s('cafeina', 'Cafeína', 'rendimiento', 'cápsula', 1, 'DiaEntreno', 'AntesEntrenar', 'capsulas',
    'Evítala en la tarde-noche si te quita el sueño.'),
  s('beta-alanina', 'Beta-alanina', 'rendimiento', 'g', 3.2, 'Diario', 'Cualquiera', 'polvo',
    'El cosquilleo en la piel es normal.'),
  s('citrulina', 'Citrulina malato', 'rendimiento', 'g', 6, 'DiaEntreno', 'AntesEntrenar', 'polvo', null),

  // Proteína
  s('whey', 'Proteína whey', 'proteina', 'scoop', 1, 'Diario', 'DespuesEntrenar', 'polvo', null),
  s('isolate', 'Proteína isolate', 'proteina', 'scoop', 1, 'Diario', 'DespuesEntrenar', 'polvo', null),
  s('caseina', 'Caseína', 'proteina', 'scoop', 1, 'Diario', 'Cualquiera', 'polvo',
    'De digestión lenta: muchos la toman antes de dormir.'),
  s('proteina-vegetal', 'Proteína vegetal', 'proteina', 'scoop', 1, 'Diario', 'DespuesEntrenar', 'polvo', null),
  s('ganador', 'Ganador de peso', 'proteina', 'scoop', 2, 'Diario', 'Cualquiera', 'polvo', null),

  // Recuperación
  s('glutamina', 'Glutamina', 'recuperacion', 'g', 5, 'Diario', 'DespuesEntrenar', 'polvo', null),
  s('bcaa', 'BCAA', 'recuperacion', 'g', 5, 'DiaEntreno', 'Cualquiera', 'polvo', null),
  s('electrolitos', 'Electrolitos', 'recuperacion', 'scoop', 1, 'DiaEntreno', 'Cualquiera', 'sobre',
    'Útiles en entrenamientos largos o con mucho calor.'),
  s('zma', 'ZMA', 'recuperacion', 'cápsula', 3, 'Diario', 'Cualquiera', 'capsulas', null),

  // Salud
  s('omega3', 'Omega 3', 'salud', 'cápsula', 2, 'Diario', 'Cualquiera', 'capsulas', 'Mejor con comida.'),
  s('multivitaminico', 'Multivitamínico', 'salud', 'tableta', 1, 'Diario', 'Cualquiera', 'tabletas', 'Mejor con comida.'),
  s('vitamina-d', 'Vitamina D3', 'salud', 'cápsula', 1, 'Diario', 'Cualquiera', 'capsulas', 'Mejor con comida.'),
  s('magnesio', 'Magnesio', 'salud', 'cápsula', 2, 'Diario', 'Cualquiera', 'capsulas', null),
  s('zinc', 'Zinc', 'salud', 'tableta', 1, 'Diario', 'Cualquiera', 'tabletas', null),
  s('colageno', 'Colágeno hidrolizado', 'salud', 'g', 10, 'Diario', 'Cualquiera', 'polvo', null),
  s('ashwagandha', 'Ashwagandha', 'salud', 'cápsula', 1, 'Diario', 'Cualquiera', 'capsulas', null)
];

export const IDS_CATALOGO = new Set(CATALOGO_SUPLEMENTOS.map((c) => c.id));

const POR_ID = new Map(CATALOGO_SUPLEMENTOS.map((c) => [c.id, c]));

// Sin catálogo (escrito a mano), el dibujo sale de la unidad
const ILUSTRACION_POR_UNIDAD = { g: 'polvo', scoop: 'polvo', 'cápsula': 'capsulas', tableta: 'tabletas', ml: 'liquido' };

export function ilustracionDe({ catalogo, unidad }) {
  return POR_ID.get(catalogo)?.ilustracion ?? ILUSTRACION_POR_UNIDAD[unidad] ?? 'polvo';
}

export function seccionDe({ catalogo }) {
  return POR_ID.get(catalogo)?.seccion ?? 'otros';
}
