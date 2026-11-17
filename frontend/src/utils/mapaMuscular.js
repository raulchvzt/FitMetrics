// Colores y textos del mapa muscular (volumen semanal y recuperación)

export const COLOR = {
  vacio: 'var(--color-neutral-700)',
  bajo: 'color-mix(in oklab, var(--color-primario) 38%, var(--color-neutral-700))',
  enRango: 'var(--color-primario)',
  exceso: 'var(--color-alerta)',
  cansado: 'var(--color-peligro)',
  medio: 'var(--color-alerta)',
  listo: 'var(--color-primario)'
};

export const LISTO_DESDE = 80;

export function estadoVolumen({ series, minimo, maximo }) {
  if (series === 0) return { clave: 'vacio', texto: 'Sin series' };
  if (series < minimo) return { clave: 'bajo', texto: 'Por debajo' };
  if (series > maximo) return { clave: 'exceso', texto: 'Arriba del rango' };
  return { clave: 'enRango', texto: 'En rango' };
}

export function estadoRecuperacion(porcentaje) {
  if (porcentaje >= LISTO_DESDE) return { clave: 'listo', texto: 'Listo' };
  if (porcentaje >= 50) return { clave: 'medio', texto: 'Recuperándose' };
  return { clave: 'cansado', texto: 'Cansado' };
}

// Series con factor 0.5 pueden dar medios: 2.5 series
export function formatoSeries(valor) {
  const n = Math.round(valor * 10) / 10;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function textoSeries(valor) {
  return `${formatoSeries(valor)} ${valor === 1 ? 'serie efectiva' : 'series efectivas'}`;
}

export function textoUltimaVez(ultimaVez) {
  if (!ultimaVez) return 'Sin entrenar en los últimos 60 días';
  const { dias, series } = ultimaVez;
  const cuando = dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `Hace ${dias} días`;
  return `${cuando} · ${textoSeries(series)}`;
}

const hora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', hour12: true });

// "hoy a las 6 p.m.", "mañana a las 7 a.m.", "el jueves a las 9 p.m."
export function cuandoEstaraListo(horas, ahora = new Date()) {
  const fecha = new Date(ahora.getTime() + horas * 3_600_000);
  fecha.setMinutes(fecha.getMinutes() >= 30 ? 60 : 0, 0, 0);

  const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDia(fecha) - inicioDia(ahora)) / 86_400_000);
  const dia = dias === 0 ? 'hoy'
    : dias === 1 ? 'mañana'
    : `el ${new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(fecha)}`;
  return `${dia} a las ${hora.format(fecha)}`;
}

export function consejo(m, ahora) {
  const faltan = m.minimo - m.series;
  if (m.recuperacion < LISTO_DESDE) {
    const frase = `Listo aprox. ${cuandoEstaraListo(m.horasParaListo, ahora)}`;
    return `${frase.endsWith('.') ? frase : `${frase}.`} Mientras, dale descanso.`;
  }
  if (m.series === 0) return 'Listo, y no lo has entrenado esta semana.';
  if (faltan > 0) return `Listo, y te ${faltan === 1 ? 'falta' : 'faltan'} ${formatoSeries(faltan)} ${faltan === 1 ? 'serie' : 'series'} esta semana.`;
  if (m.series > m.maximo) return `Vas ${formatoSeries(m.series - m.maximo)} arriba de tu rango: puedes bajarle.`;
  return 'Listo para entrenar, y vas en rango esta semana.';
}
