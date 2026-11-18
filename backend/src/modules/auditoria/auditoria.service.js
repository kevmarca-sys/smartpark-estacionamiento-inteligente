/**
 * Módulo Auditoría · Servicio
 *
 * Registra las operaciones importantes y permite consultarlas con filtros.
 */

const { pool } = require('../../config/db');
const repo = require('./auditoria.repository');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');

/**
 * Registra una operación importante: usuario, fecha/hora, acción y registro afectado.
 * @param {object} ctx  { usuario: {id, nombre, rol}, ip }
 * @param {object} datos { accion, entidad, registroId, detalle }
 * @param {object} [db] cliente de transacción (para que la auditoría quede en la misma transacción)
 */
async function registrar(ctx, { accion, entidad, registroId, detalle }, db = pool) {
  await repo.insertar(db, {
    usuarioId: ctx?.usuario?.id,
    usuarioNombre: ctx?.usuario?.nombre,
    rol: ctx?.usuario?.rol,
    accion,
    entidad,
    registroId,
    detalle,
    ip: ctx?.ip,
  });
}

/** Lista los registros de auditoría con filtros y paginación. */
async function listar(query) {
  const pag = obtenerPaginacion(query);
  const { filas, total } = await repo.listar(query, pag);
  return respuestaPaginada(filas, total, pag);
}

module.exports = { registrar, listar, recientes: repo.recientes };
