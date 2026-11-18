const PDFDocument = require('pdfkit');
const env = require('../config/env');
const { generarQrBuffer } = require('./qr');

const AZUL = '#1E3A8A';
const fecha = (f) => (f ? new Date(f).toLocaleString('es-EC', { timeZone: env.tzNegocio }) : '-');
const dinero = (n) => `$${Number(n || 0).toFixed(2)}`;

function encabezado(doc, titulo) {
  doc.rect(0, 0, doc.page.width, 80).fill(AZUL);
  doc.fillColor('#fff').fontSize(22).text('SmartPark', 40, 22);
  doc.fontSize(10).text('Estacionamiento inteligente · Av. de las Américas, Cuenca - Ecuador', 40, 50);
  doc.fillColor('#0b1c30').fontSize(16).text(titulo, 40, 105);
  doc.moveDown();
}

/** Comprobante de pago de una sesión (innovación: generación de documentos PDF). */
async function comprobantePago(res, s) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="comprobante-${s.codigo_ticket}.pdf"`);
  doc.pipe(res);

  encabezado(doc, 'Comprobante de pago');
  const filas = [
    ['Ticket', s.codigo_ticket],
    ['Placa', s.placa],
    ['Espacio', s.espacio],
    ['Entrada', fecha(s.fecha_entrada)],
    ['Salida', fecha(s.fecha_salida)],
    ['Tiempo', `${s.detalle_calculo?.minutos ?? '-'} minutos`],
    ['Método de pago', s.metodo || '-'],
    ['Cobrado por', s.cobrador || '-'],
  ];
  doc.fontSize(10);
  filas.forEach(([k, v]) => {
    doc.font('Helvetica-Bold').text(`${k}: `, { continued: true }).font('Helvetica').text(String(v));
  });

  const d = s.detalle_calculo || {};
  doc.moveDown().font('Helvetica-Bold').text('Detalle del cálculo').font('Helvetica');
  if (d.enGracia) doc.text('Salida dentro del tiempo de gracia: $0.00');
  if (d.fracciones) doc.text(`Tarifa base: ${d.fracciones} fracciones × ${dinero(d.valorFraccion)} = ${dinero(d.subtotal)}`);
  if (d.topeAplicado) doc.text('Se aplicó el tope diario');
  (d.ajustes || []).forEach((a) => doc.text(`${a.nombre} (${a.porcentaje > 0 ? '+' : ''}${a.porcentaje}%): ${dinero(a.monto)}`));

  doc.moveDown().fontSize(16).font('Helvetica-Bold').fillColor(AZUL).text(`TOTAL: ${dinero(s.total)}`);

  const qr = await generarQrBuffer(s.codigo_ticket);
  doc.image(qr, doc.page.width - 140, 105, { width: 100 });
  doc.fontSize(8).fillColor('#64748b').font('Helvetica')
    .text(`Generado el ${fecha(new Date())}`, 40, doc.page.height - 60);
  doc.end();
}

/** Reporte PDF de ingresos y ocupación para el administrador. */
function reporteGeneral(res, { desde, hasta, resumen, porDia, porTipo, topClientes }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="reporte-smartpark.pdf"');
  doc.pipe(res);

  encabezado(doc, `Reporte de ingresos y ocupación (${desde} al ${hasta})`);
  doc.fontSize(11);
  doc.text(`Ingresos totales: ${dinero(resumen.ingresos)}`);
  doc.text(`Sesiones cerradas: ${resumen.sesiones}`);
  doc.text(`Tiempo promedio de permanencia: ${resumen.minutosPromedio} minutos`);
  doc.text(`Ticket promedio: ${dinero(resumen.ticketPromedio)}`);

  doc.moveDown().font('Helvetica-Bold').text('Ingresos por día').font('Helvetica');
  porDia.forEach((d) => doc.text(`${d.dia}   ${String(d.sesiones).padStart(3)} sesiones   ${dinero(d.ingresos)}`));

  doc.moveDown().font('Helvetica-Bold').text('Sesiones por tipo de vehículo').font('Helvetica');
  porTipo.forEach((t) => doc.text(`${t.tipo}: ${t.sesiones} sesiones · ${dinero(t.ingresos)}`));

  doc.moveDown().font('Helvetica-Bold').text('Clientes frecuentes').font('Helvetica');
  topClientes.forEach((c, i) => doc.text(`${i + 1}. ${c.placa} ${c.cliente ? `(${c.cliente})` : ''} - ${c.visitas} visitas · ${dinero(c.gastado)}`));

  doc.fontSize(8).fillColor('#64748b').text(`Generado el ${fecha(new Date())}`, 40, doc.page.height - 50);
  doc.end();
}

module.exports = { comprobantePago, reporteGeneral };
