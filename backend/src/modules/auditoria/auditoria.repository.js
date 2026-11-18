const { query } = require('../../config/db');
const { construirOrden } = require('../../utils/paginacion');
const { crearFiltros } = require('../../utils/filtros');

/** Inserta un registro de auditoría. `db` puede ser el cliente de una transacción. */
async function insertar(db, { usuarioId, usuarioNombre, rol, accion, entidad, registroId, detalle, ip }) {
  await db.query(
    `INSERT INTO auditoria (usuario_id, usuario_nombre, rol, accion, entidad, registro_id, detalle, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [usuarioId || null, usuarioNombre || null, rol || null, accion, entidad,
      registroId === undefined || registroId === null ? null : String(registroId),
      detalle ? JSON.stringify(detalle) : null, ip || null],
  );
}

async function listar({ usuarioId, accion, entidad, desde, hasta, q, ordenarPor, direccion }, { limite, offset }) {
  const f = crearFiltros();
  if (usuarioId) f.agregar('a.usuario_id = ?', usuarioId);
  if (accion) f.agregar('a.accion = ?', accion);
  if (entidad) f.agregar('a.entidad = ?', entidad);
  if (desde) f.agregar('a.fecha >= ?::date', desde);
  if (hasta) f.agregar("a.fecha < (?::date + INTERVAL '1 day')", hasta);
  if (q) f.agregar('(a.registro_id ILIKE ? OR a.usuario_nombre ILIKE ? OR a.detalle::text ILIKE ?)', `%${q}%`);

  const orden = construirOrden(ordenarPor, direccion, { fecha: 'a.fecha', accion: 'a.accion', usuario: 'a.usuario_nombre' }, 'fecha');
  const total = await query(`SELECT COUNT(*)::int AS total FROM auditoria a ${f.where}`, f.valores);
  const filas = await query(
    `SELECT a.* FROM auditoria a ${f.where} ${orden} LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`,
    [...f.valores, limite, offset],
  );
  return { filas: filas.rows, total: total.rows[0].total };
}

async function recientes(limite = 10) {
  const r = await query(
    `SELECT id, usuario_nombre, accion, entidad, registro_id, detalle, fecha
       FROM auditoria
      WHERE accion IN ('REGISTRAR_ENTRADA', 'REGISTRAR_SALIDA', 'INHABILITAR_ESPACIO', 'HABILITAR_ESPACIO', 'ANULAR_SESION')
      ORDER BY fecha DESC LIMIT $1`,
    [limite],
  );
  return r.rows;
}

module.exports = { insertar, listar, recientes };
