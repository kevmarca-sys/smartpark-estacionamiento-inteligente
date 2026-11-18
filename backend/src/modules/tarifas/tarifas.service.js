const repo = require('./tarifas.repository');
const espaciosRepo = require('../espacios/espacios.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { calcularTarifa, tarifaVigente } = require('../../utils/calculadoraTarifa');
const { emitirCambio } = require('../../services/socket');

async function obtenerConfiguracion() {
  const [tarifas, reglas, resumen] = await Promise.all([repo.listarTarifas(), repo.listarReglas(), espaciosRepo.resumen()]);
  const ahora = new Date();
  const vigentes = tarifas.map((t) => tarifaVigente({ tarifa: t, reglas, ocupacion: resumen.ocupacion, ahora, zonaHoraria: env.tzNegocio }));
  return { tarifas, reglas, vigentes, ocupacion: resumen.ocupacion };
}

async function actualizarTarifa(ctx, tipo, datos) {
  const antes = await repo.buscarTarifa(tipo);
  if (!antes) throw AppError.notFound('Tipo de vehículo no encontrado');
  const despues = await repo.actualizarTarifa(tipo, datos);
  await auditoria.registrar(ctx, {
    accion: 'CAMBIAR_TARIFA', entidad: 'tarifas', registroId: tipo,
    detalle: {
      antes: { valorHora: antes.valor_hora, fraccion: antes.fraccion_minutos, gracia: antes.minutos_gracia, tope: antes.tope_diario },
      despues: { valorHora: despues.valor_hora, fraccion: despues.fraccion_minutos, gracia: despues.minutos_gracia, tope: despues.tope_diario },
    },
  });
  emitirCambio('tarifa_actualizada', { tipo });
  return despues;
}

async function actualizarRegla(ctx, codigo, datos) {
  const antes = await repo.buscarRegla(codigo);
  if (!antes) throw AppError.notFound('Regla de tarifa no encontrada');

  if (['HORA_PICO', 'NOCTURNA'].includes(codigo) && (!datos.horaInicio || !datos.horaFin)) {
    throw AppError.badRequest('Esta regla necesita hora de inicio y hora de fin');
  }
  if (codigo === 'ALTA_DEMANDA' && (datos.umbral == null || datos.umbral < 1 || datos.umbral > 100)) {
    throw AppError.badRequest('El umbral de ocupación debe estar entre 1% y 100%');
  }
  if (codigo === 'CLIENTE_FRECUENTE' && (datos.umbral == null || datos.umbral < 1)) {
    throw AppError.badRequest('Indique el número mínimo de visitas (al menos 1)');
  }
  if (['NOCTURNA', 'CLIENTE_FRECUENTE'].includes(codigo) && datos.porcentaje > 0) {
    throw AppError.businessRule('Esta regla es un descuento: el porcentaje debe ser negativo o cero');
  }
  if (['ALTA_DEMANDA', 'HORA_PICO'].includes(codigo) && datos.porcentaje < 0) {
    throw AppError.businessRule('Esta regla es un recargo: el porcentaje debe ser positivo o cero');
  }

  const despues = await repo.actualizarRegla(codigo, datos);
  await auditoria.registrar(ctx, {
    accion: 'CAMBIAR_REGLA_TARIFA', entidad: 'reglas_tarifa', registroId: codigo,
    detalle: { antes: { activa: antes.activa, porcentaje: antes.porcentaje, umbral: antes.umbral }, despues: { activa: despues.activa, porcentaje: despues.porcentaje, umbral: despues.umbral } },
  });
  emitirCambio('tarifa_actualizada', { regla: codigo });
  return despues;
}

async function simular({ tipoVehiculo, fechaEntrada, fechaSalida, ocupacion, visitasPrevias }) {
  const [tarifa, reglas] = await Promise.all([repo.buscarTarifa(tipoVehiculo), repo.listarReglas()]);
  return calcularTarifa({
    fechaEntrada, fechaSalida, tarifa, reglas, ocupacionEntrada: ocupacion, visitasPrevias, zonaHoraria: env.tzNegocio,
  });
}

module.exports = { obtenerConfiguracion, actualizarTarifa, actualizarRegla, simular };
