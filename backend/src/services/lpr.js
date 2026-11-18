/**
 * Servicio de reconocimiento de placas (LPR)
 *
 * Integración con la API externa de Plate Recognizer. El token se lee de la variable
 * PLATE_RECOGNIZER_TOKEN y nunca se expone al frontend.
 */

const env = require('../config/env');
const AppError = require('../utils/AppError');
const { normalizarPlaca, esPlacaValida } = require('../utils/validadores');

/**
 * Reconocimiento automático de placas (LPR) usando la API de Plate Recognizer.
 * Integración con servicio externo: se envía la foto tomada por la cámara del
 * guardia y se recibe la placa leída con su porcentaje de confianza.
 */
async function leerPlaca(imagenBuffer, mimetype) {
  if (!env.plateRecognizer.token) {
    throw AppError.unavailable('El reconocimiento de placas no está configurado. Ingrese la placa manualmente.');
  }

  const formulario = new FormData();
  formulario.append('upload', new Blob([imagenBuffer], { type: mimetype || 'image/jpeg' }), 'placa.jpg');
  if (env.plateRecognizer.regions) formulario.append('regions', env.plateRecognizer.regions);

  let respuesta;
  try {
    respuesta = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method: 'POST',
      headers: { Authorization: `Token ${env.plateRecognizer.token}` },
      body: formulario,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw AppError.unavailable('No se pudo conectar con el servicio de lectura de placas. Ingrese la placa manualmente.');
  }

  if (!respuesta.ok) {
    throw AppError.unavailable('El servicio de lectura de placas respondió con un error. Ingrese la placa manualmente.');
  }

  const datos = await respuesta.json();
  const mejor = (datos.results || []).sort((a, b) => b.score - a.score)[0];
  if (!mejor) {
    throw AppError.businessRule('No se detectó ninguna placa en la imagen. Intente de nuevo o ingrésela manualmente.', 'PLACA_NO_DETECTADA');
  }

  const placa = normalizarPlaca(mejor.plate);
  const confianza = Math.round(mejor.score * 10000) / 100;
  return {
    placa,
    confianza,
    formatoValido: esPlacaValida(placa),
    confiable: confianza >= 80 && esPlacaValida(placa),
    tipoSugerido: mejor.vehicle?.type === 'Motorcycle' ? 'MOTO' : 'AUTO',
  };
}

module.exports = { leerPlaca };
