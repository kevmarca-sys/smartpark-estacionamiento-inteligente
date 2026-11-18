const { test } = require('node:test');
const assert = require('node:assert');
const { elegirLectura, ajustarAPatron } = require('../src/services/lpr');

test('corrige confusiones del OCR en placas de moto', () => {
  assert.strictEqual(ajustarAPatron('AG5I2H', 'LLNNNL'), 'AG512H');
  assert.strictEqual(ajustarAPatron('A6512H', 'LLNNNL'), 'AG512H');
});

test('elige la lectura de moto con formato válido', () => {
  const r = elegirLectura([{ plate: 'pj8o4k', score: 0.9, vehicle: { type: 'Motorcycle' }, candidates: [] }]);
  assert.strictEqual(r.placa, 'PJ804K');
  assert.strictEqual(r.esMoto, true);
});

test('prefiere un candidato válido aunque tenga menor confianza', () => {
  const r = elegirLectura([{ plate: 'gm33', score: 0.95, candidates: [{ plate: 'gm337f', score: 0.85 }] }]);
  assert.strictEqual(r.placa, 'GM337F');
});

test('mantiene las placas de auto', () => {
  assert.strictEqual(elegirLectura([{ plate: 'act5204', score: 0.97 }]).placa, 'ACT-5204');
  assert.strictEqual(elegirLectura([{ plate: 'acts204', score: 0.9 }]).placa, 'ACT-5204');
});
