import * as reportesService from '../services/reportes.service.js';
import { generarReportePdf } from '../utils/reportePdf.js';
import { PERIODOS_REPORTE } from '../utils/reportes.js';
import { HttpError } from '../utils/httpError.js';

function leerPeriodo(query) {
  const dias = query.dias === undefined ? 30 : Number(query.dias);
  if (!PERIODOS_REPORTE.includes(dias)) {
    throw new HttpError(400, `El periodo debe ser uno de: ${PERIODOS_REPORTE.join(', ')} días`);
  }
  return dias;
}

// Fecha de hoy en México (en UTC ya puede ser mañana por la noche)
const ZONA_IANA = process.env.ZONA_IANA || 'America/Mexico_City';

function nombreArchivo(tipo, extension) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_IANA }).format(new Date());
  return `fitmetrics-${tipo}-${hoy}.${extension}`;
}

export async function resumen(req, res) {
  const dias = leerPeriodo(req.query);
  res.json(await reportesService.resumen(req.usuario.id, dias));
}

export async function csv(req, res) {
  const dias = leerPeriodo(req.query);
  const tipo = req.query.tipo ?? 'series';

  if (!reportesService.TIPOS_CSV.includes(tipo)) {
    throw new HttpError(400, `El tipo debe ser uno de: ${reportesService.TIPOS_CSV.join(', ')}`);
  }

  const contenido = await reportesService.exportarCsv(req.usuario.id, dias, tipo);
  res.attachment(nombreArchivo(tipo, 'csv'));
  res.type('text/csv; charset=utf-8');
  res.send(contenido);
}

export async function pdf(req, res) {
  const dias = leerPeriodo(req.query);
  // Primero se consultan los datos: si algo falla, todavía se puede responder con JSON
  const datos = await reportesService.resumen(req.usuario.id, dias);

  res.attachment(nombreArchivo('reporte', 'pdf'));
  res.type('application/pdf');
  generarReportePdf(datos).pipe(res);
}