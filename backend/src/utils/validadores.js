/**
 * Validadores propios de Ecuador.
 */

// Autos: ABC-1234 o ABC-123 (placas antiguas). Motos: AB123C
const REGEX_PLACA_AUTO = /^[A-Z]{3}-\d{3,4}$/;
const REGEX_PLACA_MOTO = /^[A-Z]{2}\d{3}[A-Z]$/;

/** Normaliza una placa: mayúsculas, sin espacios y con guion en autos (abc1234 -> ABC-1234). */
function normalizarPlaca(placa) {
  if (!placa) return '';
  const limpia = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z]{3}\d{3,4}$/.test(limpia)) return `${limpia.slice(0, 3)}-${limpia.slice(3)}`;
  return limpia;
}

function esPlacaValida(placa) {
  return REGEX_PLACA_AUTO.test(placa) || REGEX_PLACA_MOTO.test(placa);
}

/**
 * Valida una cédula ecuatoriana con el algoritmo módulo 10.
 * - 10 dígitos
 * - provincia 01-24 o 30 (ecuatorianos en el exterior)
 * - tercer dígito menor a 6 (persona natural)
 */
function esCedulaValida(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(cedula[2]) >= 6) return false;

  let suma = 0;
  for (let i = 0; i < 9; i += 1) {
    let producto = Number(cedula[i]) * (i % 2 === 0 ? 2 : 1);
    if (producto > 9) producto -= 9;
    suma += producto;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(cedula[9]);
}

module.exports = { normalizarPlaca, esPlacaValida, esCedulaValida };
