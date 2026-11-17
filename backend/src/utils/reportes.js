// Cálculos de los reportes (sin base de datos).
// Las fechas llegan como texto 'AAAA-MM-DD' en la zona horaria del usuario
// y se manejan en UTC para que la hora del servidor no las mueva.

export const PERIODOS_REPORTE = [30, 90, 180, 365];

// Con más de 90 días las barras por semana ya no caben en el teléfono
export function agrupacionDelPeriodo(dias) {
  return dias > 90 ? 'mes' : 'semana';
}

function aFecha(texto) {
  return new Date(`${texto}T00:00:00Z`);
}

function aTexto(fecha) {
  return fecha.toISOString().slice(0, 10);
}

// Lunes de la semana a la que pertenece la fecha
export function inicioSemana(texto) {
  const fecha = aFecha(texto);
  const desdeLunes = (fecha.getUTCDay() + 6) % 7;
  fecha.setUTCDate(fecha.getUTCDate() - desdeLunes);
  return aTexto(fecha);
}

export function inicioMes(texto) {
  return `${texto.slice(0, 7)}-01`;
}

// Junta los días entrenados en semanas o meses, incluyendo los que quedaron en cero
export function agruparPorPeriodo(dias, { inicio, fin, agrupacion }) {
  const clave = agrupacion === 'mes' ? inicioMes : inicioSemana;
  const grupos = new Map();

  const cursor = aFecha(clave(inicio));
  const ultimo = aFecha(clave(fin));
  while (cursor <= ultimo) {
    const texto = aTexto(cursor);
    grupos.set(texto, { inicio: texto, sesiones: 0, seriesEfectivas: 0, volumenKg: 0 });
    if (agrupacion === 'mes') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  for (const d of dias) {
    const grupo = grupos.get(clave(d.dia));
    if (!grupo) continue;
    grupo.sesiones += d.sesiones;
    grupo.seriesEfectivas += d.seriesEfectivas;
    grupo.volumenKg += d.volumenKg;
  }
  return [...grupos.values()];
}

// Sesiones por día de la semana, empezando en lunes
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function frecuenciaPorDiaSemana(dias) {
  const conteo = DIAS_SEMANA.map((nombre) => ({ dia: nombre, sesiones: 0 }));
  for (const d of dias) {
    const indice = (aFecha(d.dia).getUTCDay() + 6) % 7;
    conteo[indice].sesiones += d.sesiones;
  }
  return conteo;
}

// Cambio porcentual contra el periodo anterior (null si antes no había nada)
export function variacion(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

// Compara el promedio semanal de series de un músculo con su rango
export function estadoVolumen(promedioSemanal, { minimo, maximo }) {
  if (promedioSemanal < minimo) return 'bajo';
  if (promedioSemanal > maximo) return 'alto';
  return 'enRango';
}

// ---------- CSV ----------

// Excel en español abre bien el archivo con coma y BOM de UTF-8 (para los acentos)
const BOM = '﻿';

function celdaCsv(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number') return String(valor);

  let texto = String(valor);
  // Evita que Excel interprete el texto como fórmula (inyección CSV)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  if (/[",\n\r]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function aCsv(columnas, filas) {
  const lineas = [columnas.map((c) => celdaCsv(c.titulo)).join(',')];
  for (const fila of filas) {
    lineas.push(columnas.map((c) => celdaCsv(fila[c.campo])).join(','));
  }
  return BOM + lineas.join('\r\n') + '\r\n';
}