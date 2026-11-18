/**
 * Servicio de códigos QR
 *
 * Construye la URL pública del ticket digital y genera su código QR en formato PNG.
 */

const QRCode = require('qrcode');
const env = require('../config/env');

/** URL pública del ticket digital (lo que contiene el código QR). */
function urlTicket(codigo) {
  return `${env.frontendUrl.replace(/\/$/, '')}/ticket/${codigo}`;
}

/** Genera el QR como imagen PNG en base64 (data URL). */
function generarQrDataUrl(codigo) {
  return QRCode.toDataURL(urlTicket(codigo), { width: 320, margin: 1, errorCorrectionLevel: 'M' });
}

function generarQrBuffer(codigo) {
  return QRCode.toBuffer(urlTicket(codigo), { width: 260, margin: 1 });
}

module.exports = { urlTicket, generarQrDataUrl, generarQrBuffer };
