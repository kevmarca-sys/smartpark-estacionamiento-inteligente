const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');
const { construirOrden } = require('../../utils/paginacion');

const SELECT_CON_SESION = `
  SELECT e.*, s.codigo_ticket, s.fecha_entrada, v.placa, v.tipo AS tipo_vehiculo
    FROM espacios e
    LEFT JOIN sesiones s ON s.espacio_id = e.id AND s.estado = 'ABIERTA'
    LEFT JOIN vehiculos v ON v.id = s.vehiculo_id`;

async function listar({ q, zona, tipo, estado, ordenarPor, direccion }, { limite, offset }) {
  const f = crearFiltros();
  if (q) f.agregar('(e.codigo ILIKE ? OR v.placa ILIKE ?)', `%${q}%`);
  if (zona) f.agregar('e.zona = ?', zona);
  if (tipo) f.agregar('e.tipo = ?', tipo);
  if (estado) f.agregar('e.estado = ?', estado);
  const orden = construirOrden(ordenarPor, direccion,
    { codigo: 'e.orden_cercania', zona: 'e.zona', tipo: 'e.tipo', estado: 'e.estado' }, 'codigo');

  const total = await query(`SELECT COUNT(*)::int AS total FROM (${SELECT_CON_SESION} ${f.where}) t`, f.valores);
  const filas = await query(
    `${SELECT_CON_SESION} ${f.where} ${orden} LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`,
    [...f.valores, limite, offset],
  );
  return { filas: filas.rows, total: total.rows[0].total };
}

async function mapa() {
  const r = await query(`${SELECT_CON_SESION} ORDER BY e.zona, e.orden_cercania`);
  return r.rows;
}

async function buscarPorId(id, db = { query }) {
  const r = await db.query('SELECT * FROM espacios WHERE id = $1', [id]);
  return r.rows[0];
}

async function buscarPorCodigo(codigo, db = { query }) {
  const r = await db.query('SELECT * FROM espacios WHERE codigo = $1', [codigo]);
  return r.rows[0];
}

/** Bloquea la fila del espacio hasta terminar la transacción (control de concurrencia). */
async function bloquearPorId(db, id) {
  const r = await db.query('SELECT * FROM espacios WHERE id = $1 FOR UPDATE', [id]);
  return r.rows[0];
}

/**
 * Asignación automática: el espacio LIBRE compatible más cercano a la entrada.
 * FOR UPDATE SKIP LOCKED: si dos guardias registran entradas al mismo tiempo,
 * cada uno recibe un espacio distinto (nunca el mismo).
 */
async function bloquearMejorLibre(db, tiposPermitidos) {
  const r = await db.query(
    `SELECT * FROM espacios
      WHERE estado = 'LIBRE' AND tipo = ANY($1::text[])
      ORDER BY array_position($1::text[], tipo), orden_cercania
      LIMIT 1
      FOR UPDATE SKIP LOCKED`,
    [tiposPermitidos],
  );
  return r.rows[0];
}

async function cambiarEstado(db, id, estado, motivo = null) {
  const r = await db.query(
    'UPDATE espacios SET estado = $2, motivo_inhabilitado = $3 WHERE id = $1 RETURNING *',
    [id, estado, motivo],
  );
  return r.rows[0];
}

async function crear({ codigo, zona, tipo, ordenCercania }) {
  const r = await query(
    'INSERT INTO espacios (codigo, zona, tipo, orden_cercania) VALUES ($1, $2, $3, $4) RETURNING *',
    [codigo, zona, tipo, ordenCercania],
  );
  return r.rows[0];
}

async function actualizar(id, { zona, tipo, ordenCercania }) {
  const r = await query(
    `UPDATE espacios SET zona = COALESCE($2, zona), tipo = COALESCE($3, tipo), orden_cercania = COALESCE($4, orden_cercania)
      WHERE id = $1 RETURNING *`,
    [id, zona ?? null, tipo ?? null, ordenCercania ?? null],
  );
  return r.rows[0];
}

async function eliminar(id) {
  await query('DELETE FROM espacios WHERE id = $1', [id]);
}

async function contarSesiones(id) {
  const r = await query('SELECT COUNT(*)::int AS n FROM sesiones WHERE espacio_id = $1', [id]);
  return r.rows[0].n;
}

async function resumen(db = { query }) {
  const r = await db.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE estado = 'LIBRE')::int AS libres,
           COUNT(*) FILTER (WHERE estado = 'OCUPADO')::int AS ocupados,
           COUNT(*) FILTER (WHERE estado = 'INHABILITADO')::int AS inhabilitados
      FROM espacios`);
  const f = r.rows[0];
  const operativos = f.total - f.inhabilitados;
  f.ocupacion = operativos > 0 ? Math.round((f.ocupados / operativos) * 10000) / 100 : 0;
  return f;
}

module.exports = {
  listar, mapa, buscarPorId, buscarPorCodigo, bloquearPorId, bloquearMejorLibre,
  cambiarEstado, crear, actualizar, eliminar, contarSesiones, resumen,
};
