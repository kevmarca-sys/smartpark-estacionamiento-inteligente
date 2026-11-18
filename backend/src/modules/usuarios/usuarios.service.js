const bcrypt = require('bcryptjs');
const repo = require('./usuarios.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');

async function listar(query) {
  const pag = obtenerPaginacion(query);
  const { filas, total } = await repo.listar(query, pag);
  return respuestaPaginada(filas, total, pag);
}

async function crear(ctx, datos) {
  const passwordHash = await bcrypt.hash(datos.password, 10);
  const usuario = await repo.crear({ ...datos, passwordHash });
  await auditoria.registrar(ctx, { accion: 'CREAR_USUARIO', entidad: 'usuarios', registroId: usuario.id, detalle: { usuario: usuario.usuario, rol: usuario.rol } });
  return usuario;
}

async function actualizar(ctx, id, datos) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Usuario no encontrado');

  const esElMismo = Number(id) === Number(ctx.usuario.id);
  if (esElMismo && (datos.activo === false || (datos.rol && datos.rol !== actual.rol))) {
    throw AppError.businessRule('No puede desactivarse ni cambiarse el rol a sí mismo');
  }
  // Regla: siempre debe existir al menos un administrador activo
  const dejaDeSerAdmin = actual.rol === 'ADMIN' && ((datos.rol && datos.rol !== 'ADMIN') || datos.activo === false);
  if (dejaDeSerAdmin && (await repo.contarAdminsActivos(id)) === 0) {
    throw AppError.businessRule('Debe existir al menos un administrador activo en el sistema');
  }

  const cambios = { ...datos };
  if (datos.password) cambios.passwordHash = await bcrypt.hash(datos.password, 10);
  delete cambios.password;

  const actualizado = await repo.actualizar(id, cambios);
  await auditoria.registrar(ctx, {
    accion: 'ACTUALIZAR_USUARIO',
    entidad: 'usuarios',
    registroId: id,
    detalle: { antes: { rol: actual.rol, activo: actual.activo }, despues: { rol: actualizado.rol, activo: actualizado.activo }, cambioPassword: Boolean(datos.password) },
  });
  return actualizado;
}

module.exports = { listar, crear, actualizar };
