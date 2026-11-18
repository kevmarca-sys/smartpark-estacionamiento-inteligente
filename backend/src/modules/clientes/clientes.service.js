const repo = require('./clientes.repository');
const vehiculosRepo = require('../vehiculos/vehiculos.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const { withTransaction } = require('../../config/db');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');

async function listar(q) {
  const pag = obtenerPaginacion(q);
  const { filas, total } = await repo.listar(q, pag);
  return respuestaPaginada(filas, total, pag);
}

async function detalle(id) {
  const cliente = await repo.buscarPorId(id);
  if (!cliente) throw AppError.notFound('Cliente no encontrado');
  return cliente;
}

/**
 * Registra un cliente y (opcionalmente) su vehículo en una sola TRANSACCIÓN.
 * - Si la placa no existe se crea el vehículo.
 * - Si la placa existe sin dueño (cliente ocasional) se asocia al nuevo cliente.
 * - Si la placa ya pertenece a otro cliente se rechaza todo (no queda el cliente a medias).
 */
async function crear(ctx, { vehiculo, ...datosCliente }) {
  return withTransaction(async (db) => {
    const cliente = await repo.crear(db, datosCliente);
    let vehiculoFinal = null;

    if (vehiculo) {
      const existente = await vehiculosRepo.bloquearPorPlaca(db, vehiculo.placa);
      if (existente && existente.cliente_id) {
        const otro = await db.query('SELECT nombres FROM clientes WHERE id = $1', [existente.cliente_id]);
        throw AppError.conflict(`Esta placa ya está registrada (asociada al cliente ${otro.rows[0]?.nombres})`, 'DUPLICADO');
      }
      vehiculoFinal = existente
        ? await vehiculosRepo.actualizar(db, existente.id, { tipo: vehiculo.tipo, clienteId: cliente.id })
        : await vehiculosRepo.crear(db, { placa: vehiculo.placa, tipo: vehiculo.tipo, clienteId: cliente.id });
    }

    await auditoria.registrar(ctx, {
      accion: 'CREAR_CLIENTE', entidad: 'clientes', registroId: cliente.id,
      detalle: { nombres: cliente.nombres, placa: vehiculoFinal?.placa },
    }, db);
    return { ...cliente, vehiculos: vehiculoFinal ? [vehiculoFinal] : [] };
  });
}

async function actualizar(ctx, id, datos) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Cliente no encontrado');
  const cliente = await repo.actualizar(id, datos);
  await auditoria.registrar(ctx, { accion: 'ACTUALIZAR_CLIENTE', entidad: 'clientes', registroId: id, detalle: { campos: Object.keys(datos) } });
  return cliente;
}

async function eliminar(ctx, id) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Cliente no encontrado');
  await repo.eliminar(id); // sus vehículos quedan como "sin registrar" (ON DELETE SET NULL), el historial se conserva
  await auditoria.registrar(ctx, { accion: 'ELIMINAR_CLIENTE', entidad: 'clientes', registroId: id, detalle: { nombres: actual.nombres } });
}

module.exports = { listar, detalle, crear, actualizar, eliminar };
