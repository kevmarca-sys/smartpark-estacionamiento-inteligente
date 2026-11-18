const repo = require('./espacios.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const { withTransaction } = require('../../config/db');
const { emitirCambio } = require('../../services/socket');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');

async function listar(query) {
  const pag = obtenerPaginacion(query);
  const { filas, total } = await repo.listar(query, pag);
  return respuestaPaginada(filas, total, pag);
}

async function mapa() {
  return { espacios: await repo.mapa(), resumen: await repo.resumen() };
}

async function crear(ctx, { codigo, tipo, ordenCercania }) {
  const espacio = await repo.crear({ codigo, zona: codigo[0], tipo, ordenCercania: ordenCercania ?? 100 });
  await auditoria.registrar(ctx, { accion: 'CREAR_ESPACIO', entidad: 'espacios', registroId: espacio.codigo, detalle: { tipo } });
  emitirCambio('espacio_creado', { espacio: espacio.codigo });
  return espacio;
}

async function actualizar(ctx, id, datos) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Espacio no encontrado');
  if (datos.tipo && datos.tipo !== actual.tipo && actual.estado === 'OCUPADO') {
    throw AppError.businessRule(`No se puede cambiar el tipo del espacio ${actual.codigo} mientras está ocupado`);
  }
  const espacio = await repo.actualizar(id, datos);
  await auditoria.registrar(ctx, {
    accion: 'ACTUALIZAR_ESPACIO', entidad: 'espacios', registroId: actual.codigo,
    detalle: { antes: { tipo: actual.tipo, orden: actual.orden_cercania }, despues: { tipo: espacio.tipo, orden: espacio.orden_cercania } },
  });
  emitirCambio('espacio_actualizado', { espacio: espacio.codigo });
  return espacio;
}

/** Habilitar / inhabilitar un espacio (con bloqueo de fila para evitar carreras con una entrada). */
async function cambiarEstado(ctx, id, { estado, motivo }) {
  const espacio = await withTransaction(async (db) => {
    const actual = await repo.bloquearPorId(db, id);
    if (!actual) throw AppError.notFound('Espacio no encontrado');

    if (estado === 'INHABILITADO') {
      if (actual.estado === 'OCUPADO') {
        throw AppError.businessRule(`No se puede inhabilitar el espacio ${actual.codigo}: está ocupado por un vehículo`, 'ESPACIO_OCUPADO');
      }
      if (actual.estado === 'INHABILITADO') throw AppError.conflict(`El espacio ${actual.codigo} ya está inhabilitado`);
    } else if (actual.estado !== 'INHABILITADO') {
      throw AppError.conflict(`El espacio ${actual.codigo} no está inhabilitado`);
    }

    const actualizado = await repo.cambiarEstado(db, id, estado, estado === 'INHABILITADO' ? motivo : null);
    await auditoria.registrar(ctx, {
      accion: estado === 'INHABILITADO' ? 'INHABILITAR_ESPACIO' : 'HABILITAR_ESPACIO',
      entidad: 'espacios', registroId: actual.codigo, detalle: { antes: actual.estado, despues: estado, motivo },
    }, db);
    return actualizado;
  });
  emitirCambio('espacio_estado', { espacio: espacio.codigo, estado: espacio.estado });
  return espacio;
}

async function eliminar(ctx, id) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Espacio no encontrado');
  if (actual.estado === 'OCUPADO') throw AppError.businessRule(`No se puede eliminar el espacio ${actual.codigo}: está ocupado`);
  if ((await repo.contarSesiones(id)) > 0) {
    throw AppError.businessRule(`El espacio ${actual.codigo} tiene historial de sesiones. Inhabilítelo en lugar de eliminarlo.`, 'TIENE_HISTORIAL');
  }
  await repo.eliminar(id);
  await auditoria.registrar(ctx, { accion: 'ELIMINAR_ESPACIO', entidad: 'espacios', registroId: actual.codigo });
  emitirCambio('espacio_eliminado', { espacio: actual.codigo });
}

module.exports = { listar, mapa, crear, actualizar, cambiarEstado, eliminar };
