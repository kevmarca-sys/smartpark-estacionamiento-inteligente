const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcularTarifa, enRango } = require('../src/utils/calculadoraTarifa');
const { esCedulaValida, normalizarPlaca, esPlacaValida } = require('../src/utils/validadores');

const tarifa = { tipo_vehiculo: 'AUTO', valor_hora: '0.50', fraccion_minutos: 15, minutos_gracia: 10, tope_diario: '6.00' };
const reglas = [
  { codigo: 'ALTA_DEMANDA', nombre: 'Alta demanda', activa: true, porcentaje: '50', umbral: '80' },
  { codigo: 'HORA_PICO', nombre: 'Hora pico', activa: true, porcentaje: '25', hora_inicio: '17:00:00', hora_fin: '19:00:00' },
  { codigo: 'NOCTURNA', nombre: 'Nocturna', activa: true, porcentaje: '-20', hora_inicio: '22:00:00', hora_fin: '06:00:00' },
  { codigo: 'CLIENTE_FRECUENTE', nombre: 'Frecuente', activa: true, porcentaje: '-10', umbral: '10' },
];
const zonaHoraria = 'America/Guayaquil';
const calc = (entrada, salida, extra = {}) => calcularTarifa({
  fechaEntrada: new Date(entrada), fechaSalida: new Date(salida), tarifa, reglas,
  ocupacionEntrada: 50, visitasPrevias: 0, zonaHoraria, ...extra,
});

test('dentro de los minutos de gracia no se cobra', () => {
  const r = calc('2026-11-20T10:00:00-05:00', '2026-11-20T10:08:00-05:00');
  assert.equal(r.total, 0);
  assert.equal(r.enGracia, true);
});

test('cobra por fracciones de 15 minutos (2 h 15 min = 9 fracciones = $1.13)', () => {
  const r = calc('2026-11-20T10:00:00-05:00', '2026-11-20T12:15:00-05:00');
  assert.equal(r.fracciones, 9);
  assert.equal(r.total, 1.13);
});

test('aplica alta demanda, hora pico y cliente frecuente', () => {
  const r = calc('2026-11-20T17:30:00-05:00', '2026-11-20T19:45:00-05:00', { ocupacionEntrada: 85, visitasPrevias: 12 });
  assert.deepEqual(r.ajustes.map((a) => a.codigo), ['ALTA_DEMANDA', 'HORA_PICO', 'CLIENTE_FRECUENTE']);
  assert.equal(r.total, 1.87); // 1.13 + 0.57 + 0.28 - 0.11
});

test('tarifa nocturna cruza la medianoche', () => {
  assert.equal(enRango(23 * 60, 22 * 60, 6 * 60), true);
  assert.equal(enRango(3 * 60, 22 * 60, 6 * 60), true);
  assert.equal(enRango(12 * 60, 22 * 60, 6 * 60), false);
});

test('aplica el tope diario', () => {
  const r = calc('2026-11-20T08:00:00-05:00', '2026-11-20T23:00:00-05:00');
  assert.equal(r.topeAplicado, true);
  assert.equal(r.subtotal, 6);
});

test('valida cédulas ecuatorianas', () => {
  assert.equal(esCedulaValida('0104567896'), true);
  assert.equal(esCedulaValida('0104567890'), false);
  assert.equal(esCedulaValida('9904567896'), false);
  assert.equal(esCedulaValida('12345'), false);
});

test('normaliza y valida placas', () => {
  assert.equal(normalizarPlaca('abc1234'), 'ABC-1234');
  assert.equal(normalizarPlaca(' aba-1234 '), 'ABA-1234');
  assert.equal(esPlacaValida('ABC-1234'), true);
  assert.equal(esPlacaValida('AB123C'), true);
  assert.equal(esPlacaValida('12-ABC'), false);
});
