export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

export function formatoTiempo(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = String(segundos % 60).padStart(2, '0');
  return `${min}:${seg}`;
}