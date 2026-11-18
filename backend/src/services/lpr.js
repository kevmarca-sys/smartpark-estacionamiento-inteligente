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
  const lectura = elegirLectura(datos.results || []);
  if (!lectura) {
    throw AppError.businessRule('No se detectó ninguna placa en la imagen. Intente de nuevo o ingrésela manualmente.', 'PLACA_NO_DETECTADA');
  }

  const confianza = Math.round(lectura.score * 10000) / 100;
  const formatoValido = esPlacaValida(lectura.placa);
  return {
    placa: lectura.placa,
    confianza,
    formatoValido,
    confiable: confianza >= UMBRAL_CONFIANZA && formatoValido,
    tipoSugerido: lectura.esMoto ? 'MOTO' : 'AUTO',
  };
}

/** Confianza mínima (%) para registrar la lectura de forma automática. */
const UMBRAL_CONFIANZA = 75;

// Caracteres que el OCR suele confundir entre letras y números.
const A_LETRA = { 0: 'O', 1: 'I', 2: 'Z', 4: 'A', 5: 'S', 6: 'G', 7: 'T', 8: 'B' };
const A_NUMERO = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', A: '4', S: '5', G: '6', T: '7', B: '8' };

// Formatos ecuatorianos: L = letra, N = número.
const PATRON_AUTO = 'LLLNNNN';
const PATRON_AUTO_ANTIGUO = 'LLLNNN';
const PATRON_MOTO = 'LLNNNL';

/**
 * Ajusta el texto leído a un patrón corrigiendo las confusiones típicas del OCR
 * según la posición (por ejemplo, "AG5I2H" → "AG512H" en una placa de moto).
 * Devuelve null si el texto no puede ajustarse al patrón.
 */
function ajustarAPatron(texto, patron) {
  if (texto.length !== patron.length) return null;
  let resultado = '';
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (patron[i] === 'L') {
      const letra = /[A-Z]/.test(c) ? c : A_LETRA[c];
      if (!letra) return null;
      resultado += letra;
    } else {
      const numero = /\d/.test(c) ? c : A_NUMERO[c];
      if (!numero) return null;
      resultado += numero;
    }
  }
  return normalizarPlaca(resultado);
}

/**
 * Elige la mejor lectura entre todos los resultados y candidatos del servicio:
 * prefiere la de mayor confianza que, una vez corregida, tenga un formato válido.
 * En motos se prueba primero el patrón de moto.
 */
function elegirLectura(resultados) {
  const opciones = [];
  for (const r of resultados) {
    const esMoto = r.vehicle?.type === 'Motorcycle';
    const candidatos = [{ plate: r.plate, score: r.score }, ...(r.candidates || [])];
    for (const c of candidatos) {
      const texto = String(c.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!texto) continue;
      const patrones = esMoto
        ? [PATRON_MOTO, PATRON_AUTO, PATRON_AUTO_ANTIGUO]
        : [PATRON_AUTO, PATRON_MOTO, PATRON_AUTO_ANTIGUO];
      const directa = normalizarPlaca(texto);
      const placa = esPlacaValida(directa)
        ? directa
        : patrones.map((p) => ajustarAPatron(texto, p)).find((x) => x && esPlacaValida(x));
      opciones.push({ placa: placa || directa, score: c.score ?? r.score, valida: Boolean(placa), esMoto: esMoto || /^[A-Z]{2}\d{3}[A-Z]$/.test(placa || '') });
    }
  }
  if (opciones.length === 0) return null;
  opciones.sort((a, b) => (b.valida - a.valida) || (b.score - a.score));
  return opciones[0];
}

module.exports = { leerPlaca, elegirLectura, ajustarAPatron };
