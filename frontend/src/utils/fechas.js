// Fechas "AAAA-MM-DD" que vienen del backend (días en hora de México).
// Se tratan en UTC para que la zona horaria del teléfono no mueva el día.

const diaMes = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const diaMesAnio = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function aFecha(texto) {
  return new Date(`${texto}T00:00:00Z`);
}

export function sumarDias(texto, dias) {
  const fecha = aFecha(texto);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export function formatoDiaMes(texto) {
  return diaMes.format(aFecha(texto));
}

export function formatoDiaMesAnio(texto) {
  return diaMesAnio.format(aFecha(texto));
}