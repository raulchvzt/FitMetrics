export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

export function formatoTiempo(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = String(segundos % 60).padStart(2, '0');
  return `${min}:${seg}`;
}

export function formatoDuracion(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = String(segundos % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
const fechaCorta = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const hora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });
const mesAnio = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
const numero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

const primeraMayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function formatoFechaHora(fecha) {
  const d = new Date(fecha);
  return `${primeraMayuscula(fechaCorta.format(d))} · ${hora.format(d)}`;
}

export function formatoMes(fecha) {
  return primeraMayuscula(mesAnio.format(new Date(fecha)));
}

export function formatoNumero(valor) {
  return numero.format(valor);
}