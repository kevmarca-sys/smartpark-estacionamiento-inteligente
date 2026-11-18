/**
 * Módulo Vehículos · Repositorio
 *
 * Acceso a datos con consultas SQL parametrizadas sobre PostgreSQL.
 */

const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');
const { construirOrden } = require('../../utils/paginacion');

const db0 = { query };

const SELECT_LISTADO = `
  SELECT v.id, v.placa, v.tipo, v.cliente_id, v.creado_en, c.nombres AS cliente, c.correo AS cliente_correo,
         COUNT(s.id) FILTER (WHERE s.estado = 'CERRADA')::int AS visitas,
         MAX(s.fecha_entrada) AS ultima_visita,
         COALESCE(SUM(s.total) FILTER (WHERE s.estado = 'CERRADA'), 0)::numeric(10,2) AS total_gastado,
         BOOL_OR(s.estado = 'ABIERTA') AS dentro
    FROM vehiculos v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN sesiones s ON s.vehiculo_id = v.id`;

/** Vehículos con cliente, visitas, gasto y estado, filtrados y paginados. */
async function listar({ q, tipo, registrado, frecuentes, ordenarPor, direccion }, { limite, offset }, umbralFrecuente = 10) {
  const f = crearFiltros();
  if (q) f.agregar('(v.placa ILIKE ? OR c.nombres ILIKE ? OR c.cedula ILIKE ?)', `%${q}%`);
  if (tipo) f.agregar('v.tipo = ?', tipo);
  if (registrado === 'true') f.agregarSinValor('v.cliente_id IS NOT NULL');
  if (registrado === 'false') f.agregarSinValor('v.cliente_id IS NULL');
  const having = frecuentes === 'true'
    ? `HAVING COUNT(s.id) FILTER (WHERE s.estado = 'CERRADA') >= ${Number(umbralFrecuente) || 10}` : '';
  const orden = construirOrden(ordenarPor, direccion,
    { placa: 'v.placa', visitas: 'visitas', ultima_visita: 'ultima_visita', total_gastado: 'total_gastado' }, 'ultima_visita');

  const base = `${SELECT_LISTADO} ${f.where} GROUP BY v.id, c.id ${having}`;
  const total = await query(`SELECT COUNT(*)::int AS total FROM (${base}) t`, f.valores);
  const filas = await query(
    `${base} ${orden} NULLS LAST LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`,
    [...f.valores, limite, offset],
  );
  return { filas: filas.rows, total: total.rows[0].total };
}

/** Vehículo por placa, con los datos de su cliente. */
async function buscarPorPlaca(placa, db = db0) {
  const r = await db.query(
    `SELECT v.*, c.nombres AS cliente, c.correo AS cliente_correo, c.cedula AS cliente_cedula, c.telefono AS cliente_telefono
       FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.placa = $1`,
    [placa],
  );
  return r.rows[0];
}

/** Vehículo por id. */
async function buscarPorId(id, db = db0) {
  const r = await db.query('SELECT * FROM vehiculos WHERE id = $1', [id]);
  return r.rows[0];
}

/** Bloquea el vehículo durante la transacción: evita dos entradas simultáneas del mismo vehículo. */
async function bloquearPorPlaca(db, placa) {
  const r = await db.query('SELECT * FROM vehiculos WHERE placa = $1 FOR UPDATE', [placa]);
  return r.rows[0];
}

/** Inserta un vehículo. */
async function crear(db, { placa, tipo, clienteId }) {
  const r = await db.query(
    'INSERT INTO vehiculos (placa, tipo, cliente_id) VALUES ($1, $2, $3) RETURNING *',
    [placa, tipo, clienteId ?? null],
  );
  return r.rows[0];
}

/** Actualiza el tipo o el cliente del vehículo. */
async function actualizar(db, id, { tipo, clienteId }) {
  const r = await db.query(
    `UPDATE vehiculos SET tipo = COALESCE($2, tipo),
            cliente_id = CASE WHEN $3::boolean THEN $4::int ELSE cliente_id END
      WHERE id = $1 RETURNING *`,
    [id, tipo ?? null, clienteId !== undefined, clienteId ?? null],
  );
  return r.rows[0];
}

/** Número de visitas cerradas del vehículo (cliente frecuente). */
async function contarVisitasCerradas(db, vehiculoId) {
  const r = await db.query("SELECT COUNT(*)::int AS n FROM sesiones WHERE vehiculo_id = $1 AND estado = 'CERRADA'", [vehiculoId]);
  return r.rows[0].n;
}

/** Indica si el vehículo está dentro del parqueadero. */
async function tieneSesionAbierta(db, vehiculoId) {
  const r = await db.query("SELECT codigo_ticket FROM sesiones WHERE vehiculo_id = $1 AND estado = 'ABIERTA'", [vehiculoId]);
  return r.rows[0];
}

/** Últimas visitas del vehículo. */
async function historial(vehiculoId, limite = 15) {
  const r = await query(
    `SELECT s.codigo_ticket, s.fecha_entrada, s.fecha_salida, s.estado, s.total, e.codigo AS espacio
       FROM sesiones s JOIN espacios e ON e.id = s.espacio_id
      WHERE s.vehiculo_id = $1 ORDER BY s.fecha_entrada DESC LIMIT $2`,
    [vehiculoId, limite],
  );
  return r.rows;
}

/** Total de visitas, gasto acumulado y permanencia promedio. */
async function estadisticas(vehiculoId) {
  const r = await query(
    `SELECT COUNT(*) FILTER (WHERE estado = 'CERRADA')::int AS visitas,
            COALESCE(SUM(total) FILTER (WHERE estado = 'CERRADA'), 0)::numeric(10,2) AS total_gastado,
            COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fecha_salida - fecha_entrada)) / 60) FILTER (WHERE estado = 'CERRADA')), 0)::int AS minutos_promedio
       FROM sesiones WHERE vehiculo_id = $1`,
    [vehiculoId],
  );
  return r.rows[0];
}

module.exports = {
  listar, buscarPorPlaca, buscarPorId, bloquearPorPlaca, crear, actualizar,
  contarVisitasCerradas, tieneSesionAbierta, historial, estadisticas,
};
