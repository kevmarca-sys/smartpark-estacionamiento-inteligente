const nodemailer = require('nodemailer');
const env = require('../config/env');
const { generarQrBuffer, urlTicket } = require('./qr');

const configurado = Boolean(env.smtp.user && env.smtp.pass);

const transporte = configurado
  ? nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  })
  : null;

const formatoFecha = (fecha) => new Date(fecha).toLocaleString('es-EC', { timeZone: env.tzNegocio });

/**
 * Notificación automática: envía el ticket con su QR al correo del cliente registrado.
 * Se ejecuta en segundo plano: si falla, el registro de entrada NO se afecta.
 */
async function enviarTicket({ correo, nombre, codigo, placa, espacio, fechaEntrada, tarifaHora }) {
  if (!configurado || !correo) return { enviado: false, motivo: 'Correo no configurado' };

  const qr = await generarQrBuffer(codigo);
  const enlace = urlTicket(codigo);
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#1E3A8A;color:#fff;padding:20px">
      <h2 style="margin:0">SmartPark</h2><p style="margin:4px 0 0">Estacionamiento inteligente · Cuenca, Ecuador</p>
    </div>
    <div style="padding:24px">
      <h3 style="margin-top:0">¡Hola ${nombre || ''}! Este es tu ticket de estacionamiento</h3>
      <table style="width:100%;font-size:14px">
        <tr><td><b>Ticket</b></td><td>${codigo}</td></tr>
        <tr><td><b>Placa</b></td><td>${placa}</td></tr>
        <tr><td><b>Espacio asignado</b></td><td>${espacio}</td></tr>
        <tr><td><b>Hora de entrada</b></td><td>${formatoFecha(fechaEntrada)}</td></tr>
        <tr><td><b>Tarifa vigente</b></td><td>$${Number(tarifaHora).toFixed(2)} / hora</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0"><img src="cid:qrticket" alt="QR del ticket" width="220"/></div>
      <div style="text-align:center"><a href="${enlace}" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Ver mi ticket en vivo</a></div>
      <p style="font-size:12px;color:#64748b;margin-top:24px">Presenta este código QR en la salida.</p>
    </div>
  </div>`;

  await transporte.sendMail({
    from: env.smtp.from || env.smtp.user,
    to: correo,
    subject: `Tu ticket SmartPark ${codigo} - Espacio ${espacio}`,
    html,
    attachments: [{ filename: 'ticket.png', content: qr, cid: 'qrticket' }],
  });
  return { enviado: true };
}

module.exports = { enviarTicket, correoConfigurado: configurado };
