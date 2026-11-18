const repo = require('./vehiculos.repository');
const tarifasRepo = require('../tarifas/tarifas.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const { query } = require('../../config/db');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');
const { normalizarPlaca } = require('../../utils/validadores');

const db0 = { query };

async function umbralFrecuente() {
  const reglas = await tarifasRepo.listarReglas();
  return Number(reglas.find((r) => r.codigo === 'CLIENTE_FRECUENTE')?.umbral || 10);
}

async function listar(q) {
  const pag = obtenerPaginacion(q);
  const umbral = await umbralFrecuente();
  const { filas, total } = await repo.listar(q, pag, umbral);
  const datos = filas.map((v) => ({ ...v, frecuente: v.visitas >= umbral }));
  return respuestaPaginada(datos, total, pag);
}

async function detalle(placaTexto) {
  const placa = normalizarPlaca(placaTexto);
  const vehiculo = await repo.buscarPorPlaca(placa);
  if (!vehiculo) throw AppError.notFound(`No existe un vehículo con la placa ${placa}`);
  const [historial, estadisticas, abierta, umbral] = await Promise.all([
    repo.historial(vehiculo.id), repo.estadisticas(vehiculo.id), repo.tieneSesionAbierta(db0, vehiculo.id), umbralFrecuente(),
  ]);
  return { ...vehiculo, estadisticas, historial, sesionAbierta: abierta?.codigo_ticket || null, frecuente: estadisticas.visitas >= umbral };
}

async function crear(ctx, datos) {
  const vehiculo = await repo.crear(db0, datos);
  await auditoria.registrar(ctx, { accion: 'CREAR_VEHICULO', entidad: 'vehiculos', registroId: vehiculo.placa });
  return vehiculo;
}

async function actualizar(ctx, id, datos) {
  const actual = await repo.buscarPorId(id);
  if (!actual) throw AppError.notFound('Vehículo no encontrado');
  if (datos.tipo && datos.tipo !== actual.tipo && (await repo.tieneSesionAbierta(db0, id))) {
    throw AppError.businessRule('No se puede cambiar el tipo de un vehículo que está dentro del estacionamiento');
  }
  const vehiculo = await repo.actualizar(db0, id, datos);
  await auditoria.registrar(ctx, {
    accion: 'ACTUALIZAR_VEHICULO', entidad: 'vehiculos', registroId: actual.placa,
    detalle: { antes: { tipo: actual.tipo, cliente: actual.cliente_id }, despues: { tipo: vehiculo.tipo, cliente: vehiculo.cliente_id } },
  });
  return vehiculo;
}

module.exports = { listar, detalle, crear, actualizar };
