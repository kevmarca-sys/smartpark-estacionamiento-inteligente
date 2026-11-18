const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');
const { construirOrden } = require('../../utils/paginacion');

const db0 = { query };

const SELECT_DETALLE = `
  SELECT s.*, v.placa, v.tipo AS tipo_vehiculo, v.cliente_id,
         c.nombres AS cliente, c.correo AS cliente_correo,
         e.codigo AS espacio, e.zona,
         ue.nombre AS guardia_entrada, us.nombre AS cobrador,
         p.metodo, p.referencia, p.monto, p.fecha AS fecha_pago,
         ROUND(EXTRACT(EPOCH FROM (COALESCE(s.fecha_salida, NOW()) - s.fecha_entrada)) / 60)::int AS minutos
    FROM sesiones s
    JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN clientes c ON c.id = v.cliente_id
    JOIN espacios e ON e.id = s.espacio_id
    JOIN usuarios ue ON ue.id = s.usuario_entrada_id
    LEFT JOIN usuarios us ON us.id = s.usuario_salida_id
    LEFT JOIN pagos p ON p.sesion_id = s.id`;

async function listar(filtros, { limite, offset }) {
  const { q, estado, desde, hasta, espacio, usuarioId, metodo, tipoVehiculo, ordenarPor, direccion } = filtros;
  const f = crearFiltros();
  if (q) f.agregar('(v.placa ILIKE ? OR s.codigo_ticket ILIKE ? OR c.nombres ILIKE ?)', `%${q}%`);
  if (estado) f.agregar('s.estado = ?', estado);
  if (desde) f.agregar("s.fecha_entrada >= (?::date)::timestamp AT TIME ZONE 'America/Guayaquil'", desde);
  if (hasta) f.agregar("s.fecha_entrada < ((?::date + 1)::timestamp AT TIME ZONE 'America/Guayaquil')", hasta);
  if (espacio) f.agregar('e.codigo = ?', String(espacio).toUpperCase());
  if (usuarioId) f.agregar('(s.usuario_entrada_id = ? OR s.usuario_salida_id = ?)', Number(usuarioId));
  if (metodo) f.agregar('p.metodo = ?', metodo);
  if (tipoVehiculo) f.agregar('v.tipo = ?', tipoVehiculo);

  const orden = construirOrden(ordenarPor, direccion,
    { fecha_entrada: 's.fecha_entrada', total: 's.total', placa: 'v.placa', minutos: 'minutos', espacio: 'e.orden_cercania' }, 'fecha_entrada');

  const total = await query(
    `SELECT COUNT(*)::int AS total, COALESCE(SUM(s.total), 0)::numeric(12,2) AS suma
       FROM sesiones s JOIN vehiculos v ON v.id = s.vehiculo_id LEFT JOIN clientes c ON c.id = v.cliente_id
       JOIN espacios e ON e.id = s.espacio_id LEFT JOIN pagos p ON p.sesion_id = s.id ${f.where}`,
    f.valores,
  );
  const filas = await query(
    `${SELECT_DETALLE} ${f.where} ${orden} NULLS LAST LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`,
    [...f.valores, limite, offset],
  );
  return { filas: filas.rows, total: total.rows[0].total, suma: total.rows[0].suma };
}

async function buscarPorCodigo(codigo, db = db0) {
  const r = await db.query(`${SELECT_DETALLE} WHERE s.codigo_ticket = $1`, [codigo]);
  return r.rows[0];
}

async function buscarPorId(id, db = db0) {
  const r = await db.query(`${SELECT_DETALLE} WHERE s.id = $1`, [id]);
  return r.rows[0];
}

/** Bloquea la sesión (FOR UPDATE): si dos personas cobran el mismo ticket a la vez, la segunda espera y luego ve que ya está cerrado. */
async function bloquearPorCodigo(db, codigo) {
  const r = await db.query('SELECT * FROM sesiones WHERE codigo_ticket = $1 FOR UPDATE', [codigo]);
  return r.rows[0];
}

async function crear(db, d) {
  const r = await db.query(
    `INSERT INTO sesiones (codigo_ticket, vehiculo_id, espacio_id, usuario_entrada_id, ocupacion_entrada, metodo_registro, confianza_lectura)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [d.codigo, d.vehiculoId, d.espacioId, d.usuarioId, d.ocupacion, d.metodoRegistro, d.confianza ?? null],
  );
  return r.rows[0];
}

async function cerrar(db, id, { usuarioId, fechaSalida, total, detalle }) {
  const r = await db.query(
    `UPDATE sesiones SET estado = 'CERRADA', usuario_salida_id = $2, fecha_salida = $3, total = $4, detalle_calculo = $5
      WHERE id = $1 RETURNING *`,
    [id, usuarioId, fechaSalida, total, JSON.stringify(detalle)],
  );
  return r.rows[0];
}

async function anular(db, id, { usuarioId, motivo }) {
  const r = await db.query(
    `UPDATE sesiones SET estado = 'ANULADA', usuario_salida_id = $2, fecha_salida = NOW(), total = 0, motivo_anulacion = $3
      WHERE id = $1 RETURNING *`,
    [id, usuarioId, motivo],
  );
  return r.rows[0];
}

async function insertarPago(db, { sesionId, monto, metodo, referencia, usuarioId, fecha }) {
  const r = await db.query(
    'INSERT INTO pagos (sesion_id, monto, metodo, referencia, usuario_id, fecha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [sesionId, monto, metodo, referencia ?? null, usuarioId, fecha],
  );
  return r.rows[0];
}

module.exports = { listar, buscarPorCodigo, buscarPorId, bloquearPorCodigo, crear, cerrar, anular, insertarPago };
