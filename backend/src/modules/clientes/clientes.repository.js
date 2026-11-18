const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');
const { construirOrden } = require('../../utils/paginacion');

async function listar({ q, ordenarPor, direccion }, { limite, offset }) {
  const f = crearFiltros();
  if (q) f.agregar('(c.nombres ILIKE ? OR c.cedula ILIKE ? OR c.correo ILIKE ? OR v.placa ILIKE ?)', `%${q}%`);
  const orden = construirOrden(ordenarPor, direccion, { nombres: 'c.nombres', creado_en: 'c.creado_en', visitas: 'visitas' }, 'nombres');
  const base = `
    SELECT c.*, COALESCE(ARRAY_AGG(DISTINCT v.placa) FILTER (WHERE v.placa IS NOT NULL), '{}') AS placas,
           (SELECT COUNT(*)::int FROM sesiones s JOIN vehiculos v2 ON v2.id = s.vehiculo_id
             WHERE v2.cliente_id = c.id AND s.estado = 'CERRADA') AS visitas
      FROM clientes c LEFT JOIN vehiculos v ON v.cliente_id = c.id
      ${f.where} GROUP BY c.id`;
  const total = await query(`SELECT COUNT(*)::int AS total FROM (${base}) t`, f.valores);
  const filas = await query(`${base} ${orden} LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`, [...f.valores, limite, offset]);
  return { filas: filas.rows, total: total.rows[0].total };
}

async function buscarPorId(id) {
  const r = await query('SELECT * FROM clientes WHERE id = $1', [id]);
  if (!r.rows[0]) return null;
  const v = await query('SELECT id, placa, tipo FROM vehiculos WHERE cliente_id = $1 ORDER BY placa', [id]);
  return { ...r.rows[0], vehiculos: v.rows };
}

async function crear(db, { nombres, cedula, correo, telefono }) {
  const r = await db.query(
    'INSERT INTO clientes (nombres, cedula, correo, telefono) VALUES ($1, $2, $3, $4) RETURNING *',
    [nombres, cedula ?? null, correo ?? null, telefono ?? null],
  );
  return r.rows[0];
}

async function actualizar(id, datos) {
  const r = await query(
    `UPDATE clientes SET nombres = COALESCE($2, nombres),
            cedula = CASE WHEN $3::boolean THEN $4 ELSE cedula END,
            correo = CASE WHEN $5::boolean THEN $6 ELSE correo END,
            telefono = CASE WHEN $7::boolean THEN $8 ELSE telefono END
      WHERE id = $1 RETURNING *`,
    [id, datos.nombres ?? null,
      datos.cedula !== undefined, datos.cedula ?? null,
      datos.correo !== undefined, datos.correo ?? null,
      datos.telefono !== undefined, datos.telefono ?? null],
  );
  return r.rows[0];
}

async function eliminar(id) {
  await query('DELETE FROM clientes WHERE id = $1', [id]);
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar };
