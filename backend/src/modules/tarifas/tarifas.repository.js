const { query } = require('../../config/db');

const db0 = { query };

async function listarTarifas(db = db0) {
  const r = await db.query("SELECT * FROM tarifas ORDER BY array_position(ARRAY['AUTO','MOTO','DISCAPACIDAD'], tipo_vehiculo)");
  return r.rows;
}

async function buscarTarifa(tipo, db = db0) {
  const r = await db.query('SELECT * FROM tarifas WHERE tipo_vehiculo = $1', [tipo]);
  return r.rows[0];
}

async function actualizarTarifa(tipo, { valorHora, fraccionMinutos, minutosGracia, topeDiario }) {
  const r = await query(
    `UPDATE tarifas SET valor_hora = $2, fraccion_minutos = $3, minutos_gracia = $4, tope_diario = $5, actualizado_en = NOW()
      WHERE tipo_vehiculo = $1 RETURNING *`,
    [tipo, valorHora, fraccionMinutos, minutosGracia, topeDiario],
  );
  return r.rows[0];
}

async function listarReglas(db = db0) {
  const r = await db.query('SELECT * FROM reglas_tarifa ORDER BY id');
  return r.rows;
}

async function buscarRegla(codigo) {
  const r = await query('SELECT * FROM reglas_tarifa WHERE codigo = $1', [codigo]);
  return r.rows[0];
}

async function actualizarRegla(codigo, { activa, porcentaje, umbral, horaInicio, horaFin }) {
  const r = await query(
    `UPDATE reglas_tarifa
        SET activa = $2, porcentaje = $3, umbral = $4, hora_inicio = $5, hora_fin = $6, actualizado_en = NOW()
      WHERE codigo = $1 RETURNING *`,
    [codigo, activa, porcentaje, umbral ?? null, horaInicio ?? null, horaFin ?? null],
  );
  return r.rows[0];
}

module.exports = { listarTarifas, buscarTarifa, actualizarTarifa, listarReglas, buscarRegla, actualizarRegla };
