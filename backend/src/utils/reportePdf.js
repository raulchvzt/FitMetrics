import PDFDocument from 'pdfkit';

// Reporte en PDF a partir del resumen del dashboard.
// Fondo blanco para que se pueda imprimir; el negro y lima quedan en el encabezado.

const COLOR = {
  texto: '#0A0A0A',
  tenue: '#6B6B6B',
  borde: '#E2E2E2',
  fondoSuave: '#F5F5F5',
  negro: '#0A0A0A',
  lima: '#D4FF3F',
  limaOscuro: '#4D7C0F',
  alerta: '#B45309',
  peligro: '#B91C1C'
};

const MARGEN = 48;
const ESTADO_MUSCULO = {
  bajo: { texto: 'Bajo', color: COLOR.alerta },
  enRango: { texto: 'En rango', color: COLOR.limaOscuro },
  alto: { texto: 'Alto', color: COLOR.peligro }
};

const numero = (valor, decimales = 0) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: decimales }).format(valor ?? 0);

const fecha = (texto, opciones = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Intl.DateTimeFormat('es-MX', { ...opciones, timeZone: 'UTC' })
    .format(new Date(`${texto}T00:00:00Z`))
    .replace('.', '');

function textoVariacion(valor) {
  if (valor === null || valor === undefined) return null;
  return `${valor > 0 ? '+' : ''}${valor}% vs. periodo anterior`;
}

export function generarReportePdf(datos) {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: MARGEN, bottom: MARGEN + 16, left: MARGEN, right: MARGEN },
    bufferPages: true,
    info: {
      Title: `Reporte de entrenamiento - ${datos.usuario}`,
      Author: 'FitMetrics'
    }
  });

  const ancho = doc.page.width - MARGEN * 2;
  const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

  function asegurarEspacio(alto) {
    if (doc.y + alto > limiteInferior()) doc.addPage();
  }

  function titulo(texto, subtitulo) {
    asegurarEspacio(70);
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR.texto).text(texto, MARGEN);
    if (subtitulo) {
      doc.font('Helvetica').fontSize(9).fillColor(COLOR.tenue).text(subtitulo, MARGEN);
    }
    doc.moveDown(0.5);
  }

  // Tabla sencilla: columnas con ancho relativo y alineación
  function tabla(columnas, filas) {
    const altoFila = 20;
    const total = columnas.reduce((suma, c) => suma + c.ancho, 0);
    const anchos = columnas.map((c) => (c.ancho / total) * ancho);

    function fila(valores, { encabezado = false, colores = [] } = {}) {
      asegurarEspacio(altoFila);
      const y = doc.y;
      let x = MARGEN;

      if (encabezado) {
        doc.rect(MARGEN, y, ancho, altoFila).fill(COLOR.fondoSuave);
      }
      valores.forEach((valor, i) => {
        doc.font(encabezado || i === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(encabezado ? 8 : 9)
          .fillColor(encabezado ? COLOR.tenue : colores[i] ?? COLOR.texto)
          .text(String(valor ?? '—'), x + 6, y + 6, {
            width: anchos[i] - 12,
            align: columnas[i].alinear ?? 'left',
            lineBreak: false,
            ellipsis: true
          });
        x += anchos[i];
      });
      doc.moveTo(MARGEN, y + altoFila).lineTo(MARGEN + ancho, y + altoFila)
        .lineWidth(0.5).strokeColor(COLOR.borde).stroke();
      doc.x = MARGEN;
      doc.y = y + altoFila;
    }

    fila(columnas.map((c) => c.titulo.toUpperCase()), { encabezado: true });
    for (const f of filas) fila(f.valores, { colores: f.colores });
  }

  function sinDatos(texto) {
    doc.font('Helvetica').fontSize(10).fillColor(COLOR.tenue).text(texto, MARGEN);
  }

  // ---------- Encabezado ----------
  const { periodo, totales, unidad } = datos;
  const altoEncabezado = 96;

  doc.rect(0, 0, doc.page.width, altoEncabezado).fill(COLOR.negro);
  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLOR.lima).text('FitMetrics', MARGEN, 28);
  doc.font('Helvetica').fontSize(11).fillColor('#FFFFFF').text('Reporte de entrenamiento', MARGEN, 56);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
    .text(datos.usuario, MARGEN, 30, { width: ancho, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#BDBDBD')
    .text(`${fecha(periodo.inicio)} - ${fecha(periodo.fin)} · últimos ${periodo.dias} días`, MARGEN, 48, { width: ancho, align: 'right' })
    .text(`Generado el ${fecha(periodo.fin)}`, MARGEN, 62, { width: ancho, align: 'right' });

  doc.x = MARGEN;
  doc.y = altoEncabezado + 8;

  // ---------- Resumen ----------
  titulo('Resumen del periodo');

  const tarjetas = [
    { etiqueta: 'Sesiones', valor: numero(totales.sesiones), nota: textoVariacion(totales.variacion.sesiones) },
    { etiqueta: 'Frecuencia', valor: `${numero(totales.sesionesPorSemana, 1)} / semana`, nota: `${numero(totales.diasEntrenados)} días entrenados` },
    { etiqueta: 'Duración promedio', valor: totales.minutosPromedio === null ? '—' : `${numero(totales.minutosPromedio)} min`, nota: null },
    { etiqueta: 'Series efectivas', valor: numero(totales.seriesEfectivas), nota: textoVariacion(totales.variacion.seriesEfectivas) },
    { etiqueta: 'Series totales', valor: numero(totales.series), nota: 'Incluye calentamiento' },
    { etiqueta: 'Volumen', valor: `${numero(totales.volumen)} ${unidad}`, nota: textoVariacion(totales.variacion.volumen) }
  ];

  const separacion = 10;
  const anchoTarjeta = (ancho - separacion * 2) / 3;
  const altoTarjeta = 62;
  asegurarEspacio(altoTarjeta * 2 + separacion);
  const yTarjetas = doc.y;

  tarjetas.forEach((t, i) => {
    const x = MARGEN + (i % 3) * (anchoTarjeta + separacion);
    const y = yTarjetas + Math.floor(i / 3) * (altoTarjeta + separacion);
    doc.roundedRect(x, y, anchoTarjeta, altoTarjeta, 8).lineWidth(0.8).strokeColor(COLOR.borde).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(COLOR.tenue).text(t.etiqueta.toUpperCase(), x + 10, y + 10, { width: anchoTarjeta - 20 });
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR.texto).text(t.valor, x + 10, y + 23, { width: anchoTarjeta - 20, lineBreak: false, ellipsis: true });
    if (t.nota) {
      doc.font('Helvetica').fontSize(7.5).fillColor(COLOR.tenue).text(t.nota, x + 10, y + 45, { width: anchoTarjeta - 20, lineBreak: false, ellipsis: true });
    }
  });
  doc.x = MARGEN;
  doc.y = yTarjetas + altoTarjeta * 2 + separacion;

  // ---------- Evolución (gráfica de barras de series efectivas) ----------
  const porMes = periodo.agrupacion === 'mes';
  titulo(
    porMes ? 'Evolución por mes' : 'Evolución por semana',
    'Series efectivas en cada ' + (porMes ? 'mes' : 'semana (de lunes a domingo)')
  );

  const altoGrafica = 130;
  asegurarEspacio(altoGrafica + 30);
  const yBase = doc.y + altoGrafica;
  const maximo = Math.max(...datos.evolucion.map((g) => g.seriesEfectivas), 1);
  const espacio = ancho / datos.evolucion.length;
  const anchoBarra = Math.min(espacio * 0.6, 36);
  const cadaCuanto = Math.ceil(datos.evolucion.length / 10); // etiquetas que sí caben

  datos.evolucion.forEach((g, i) => {
    const alto = (g.seriesEfectivas / maximo) * (altoGrafica - 18);
    const x = MARGEN + i * espacio + (espacio - anchoBarra) / 2;
    if (alto > 0) {
      doc.roundedRect(x, yBase - alto, anchoBarra, alto, Math.min(3, alto / 2)).fill(COLOR.lima);
      doc.roundedRect(x, yBase - alto, anchoBarra, alto, Math.min(3, alto / 2)).lineWidth(0.6).strokeColor(COLOR.limaOscuro).stroke();
    }
    if (g.seriesEfectivas > 0 && datos.evolucion.length <= 16) {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR.texto)
        .text(numero(g.seriesEfectivas), x - 10, yBase - alto - 11, { width: anchoBarra + 20, align: 'center' });
    }
    if (i % cadaCuanto === 0) {
      const etiqueta = porMes
        ? fecha(g.inicio, { month: 'short', year: '2-digit' })
        : fecha(g.inicio, { day: 'numeric', month: 'short' });
      doc.font('Helvetica').fontSize(7).fillColor(COLOR.tenue)
        .text(etiqueta, MARGEN + i * espacio - 10, yBase + 5, { width: espacio + 20, align: 'center' });
    }
  });
  doc.moveTo(MARGEN, yBase).lineTo(MARGEN + ancho, yBase).lineWidth(0.8).strokeColor(COLOR.tenue).stroke();
  doc.x = MARGEN;
  doc.y = yBase + 20;

  tabla(
    [
      { titulo: porMes ? 'Mes' : 'Semana del', ancho: 3 },
      { titulo: 'Sesiones', ancho: 2, alinear: 'right' },
      { titulo: 'Series efectivas', ancho: 2, alinear: 'right' },
      { titulo: `Volumen (${unidad})`, ancho: 2, alinear: 'right' }
    ],
    datos.evolucion.map((g) => ({
      valores: [
        porMes ? fecha(g.inicio, { month: 'long', year: 'numeric' }) : fecha(g.inicio),
        numero(g.sesiones),
        numero(g.seriesEfectivas),
        numero(g.volumen)
      ]
    }))
  );

  // ---------- Frecuencia por día ----------
  titulo('Días que más entrenas', 'Sesiones por día de la semana');
  const maxDia = Math.max(...datos.frecuencia.map((d) => d.sesiones), 1);
  const anchoEtiqueta = 70;
  const anchoBarras = ancho - anchoEtiqueta - 40;

  for (const d of datos.frecuencia) {
    asegurarEspacio(18);
    const y = doc.y;
    doc.font('Helvetica').fontSize(9).fillColor(COLOR.texto).text(d.dia, MARGEN, y + 3, { width: anchoEtiqueta });
    doc.roundedRect(MARGEN + anchoEtiqueta, y + 2, anchoBarras, 10, 5).fill(COLOR.fondoSuave);
    if (d.sesiones > 0) {
      doc.roundedRect(MARGEN + anchoEtiqueta, y + 2, Math.max((d.sesiones / maxDia) * anchoBarras, 10), 10, 5).fill(COLOR.negro);
    }
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.texto)
      .text(numero(d.sesiones), MARGEN + anchoEtiqueta + anchoBarras + 6, y + 3, { width: 34, align: 'right' });
    doc.x = MARGEN;
    doc.y = y + 18;
  }

  // ---------- Ejercicios ----------
  titulo('Ejercicios más trabajados', 'Ordenados por series efectivas');
  if (datos.ejercicios.length === 0) {
    sinDatos('No registraste ejercicios en este periodo.');
  } else {
    tabla(
      [
        { titulo: 'Ejercicio', ancho: 4 },
        { titulo: 'Sesiones', ancho: 1.5, alinear: 'right' },
        { titulo: 'Series efectivas', ancho: 2, alinear: 'right' },
        { titulo: 'Mejor 1RM estimado', ancho: 2.5, alinear: 'right' }
      ],
      datos.ejercicios.map((e) => ({
        valores: [
          e.nombre,
          numero(e.sesiones),
          numero(e.seriesEfectivas),
          e.mejorE1rm === null ? '—' : `${numero(e.mejorE1rm, 1)} ${unidad}`
        ]
      }))
    );
  }

  // ---------- Músculos ----------
  titulo('Volumen por grupo muscular', 'Promedio semanal de series efectivas comparado con tu rango');
  tabla(
    [
      { titulo: 'Músculo', ancho: 3 },
      { titulo: 'Series totales', ancho: 2, alinear: 'right' },
      { titulo: 'Promedio / semana', ancho: 2, alinear: 'right' },
      { titulo: 'Rango', ancho: 1.5, alinear: 'right' },
      { titulo: 'Estado', ancho: 1.5, alinear: 'right' }
    ],
    datos.musculos.map((m) => {
      const estado = ESTADO_MUSCULO[m.estado];
      return {
        valores: [m.musculo, numero(m.series, 1), numero(m.promedioSemanal, 1), `${m.minimo}-${m.maximo}`, estado.texto],
        colores: [null, null, null, null, estado.color]
      };
    })
  );

  // ---------- Suplementos ----------
  titulo('Suplementos', 'Inventario actual y tomas confirmadas en el periodo');
  if (datos.suplementos.length === 0) {
    sinDatos('No tienes suplementos registrados.');
  } else {
    tabla(
      [
        { titulo: 'Suplemento', ancho: 3 },
        { titulo: 'Stock', ancho: 2, alinear: 'right' },
        { titulo: 'Tomas', ancho: 1.5, alinear: 'right' },
        { titulo: 'Le quedan', ancho: 2, alinear: 'right' },
        { titulo: 'Estado', ancho: 2, alinear: 'right' }
      ],
      datos.suplementos.map((s) => {
        const estado = s.agotado
          ? { texto: 'Agotado', color: COLOR.peligro }
          : s.requiereReposicion
            ? { texto: 'Reponer pronto', color: COLOR.alerta }
            : { texto: 'Suficiente', color: COLOR.limaOscuro };
        return {
          valores: [
            s.nombre,
            `${numero(s.stock, 2)} ${s.unidad}`,
            numero(s.tomas),
            `${numero(s.diasRestantes)} días`,
            estado.texto
          ],
          colores: [null, null, null, null, estado.color]
        };
      })
    );
  }

  // ---------- Pie de página en todas las hojas ----------
  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(paginas.start + i);
    const y = doc.page.height - MARGEN + 8;
    doc.page.margins.bottom = 0; // para que el pie no cree otra hoja
    doc.font('Helvetica').fontSize(8).fillColor(COLOR.tenue)
      .text('FitMetrics · Las series efectivas son las de trabajo con RIR de 3 o menos.', MARGEN, y, { width: ancho, lineBreak: false })
      .text(`Página ${i + 1} de ${paginas.count}`, MARGEN, y, { width: ancho, align: 'right', lineBreak: false });
  }

  doc.end();
  return doc;
}