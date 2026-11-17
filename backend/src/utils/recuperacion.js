// Estimación de la recuperación de cada músculo a partir de sus series efectivas recientes.
//
// Cada serie deja una "carga" en el músculo: su factor (1 = primario, 0.5 = secundario)
// multiplicado por lo dura que fue (RIR más bajo = más carga). Esa carga se va
// recuperando en línea recta hasta desaparecer en las horas que tarda ese músculo.
// Con CARGA_MAXIMA o más acumulada, el músculo está al 0 %.

// Horas para recuperarse por completo de una sesión (músculos grandes tardan más)
export const HORAS_RECUPERACION = {
  'Pecho': 60,
  'Espalda': 60,
  'Hombro anterior': 48,
  'Hombro lateral': 36,
  'Hombro posterior': 36,
  'Bíceps': 48,
  'Tríceps': 48,
  'Cuádriceps': 72,
  'Isquiotibiales': 72,
  'Glúteos': 72,
  'Pantorrillas': 36,
  'Abdomen': 36
};
export const HORAS_POR_DEFECTO = 48;
export const HORAS_MAXIMAS = Math.max(...Object.values(HORAS_RECUPERACION));

export const CARGA_MAXIMA = 10;   // ≈ 10 series efectivas pesadas en una sesión
export const LISTO_DESDE = 80;    // % a partir del cual se considera listo

const PESO_RIR = [1.2, 1.1, 1, 0.9];

export function pesoPorRir(rir) {
  return PESO_RIR[rir] ?? PESO_RIR.at(-1);
}

export function horasDe(musculo) {
  return HORAS_RECUPERACION[musculo] ?? HORAS_POR_DEFECTO;
}

/** series: [{ factor, rir, horas }] — horas = hace cuánto se hizo */
export function cargaPendiente(series, horasTotales, dentroDe = 0) {
  return series.reduce((total, s) => {
    const restante = 1 - (Number(s.horas) + dentroDe) / horasTotales;
    return restante > 0 ? total + Number(s.factor) * pesoPorRir(s.rir) * restante : total;
  }, 0);
}

export function porcentaje(carga) {
  return Math.round(100 * (1 - Math.min(1, carga / CARGA_MAXIMA)));
}

/** Devuelve { recuperacion: 0-100, horasParaListo } */
export function recuperacionDe(series, horasTotales) {
  const actual = porcentaje(cargaPendiente(series, horasTotales));
  if (actual >= LISTO_DESDE) return { recuperacion: actual, horasParaListo: 0 };

  let horas = 1;
  while (horas < horasTotales && porcentaje(cargaPendiente(series, horasTotales, horas)) < LISTO_DESDE) {
    horas += 1;
  }
  return { recuperacion: actual, horasParaListo: horas };
}

/**
 * volumen: [{ id, musculo, series, minimo, maximo }]   (semana actual)
 * recientes: [{ grupoMuscularId, factor, rir, horas }] (últimas HORAS_MAXIMAS horas)
 * ultimas: [{ grupoMuscularId, dias, series }]         (última sesión de cada músculo)
 */
export function estadoDelCuerpo({ volumen, recientes, ultimas }) {
  return volumen.map((v) => {
    const suyas = recientes.filter((r) => r.grupoMuscularId === v.id);
    const ultima = ultimas.find((u) => u.grupoMuscularId === v.id);
    return {
      id: v.id,
      nombre: v.musculo,
      series: Number(v.series),
      minimo: v.minimo,
      maximo: v.maximo,
      ...recuperacionDe(suyas, horasDe(v.musculo)),
      ultimaVez: ultima ? { dias: ultima.dias, series: Number(ultima.series) } : null
    };
  });
}
