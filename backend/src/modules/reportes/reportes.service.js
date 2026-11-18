const repo = require('./reportes.repository');
const espaciosRepo = require('../espacios/espacios.repository');
const tarifasRepo = require('../tarifas/tarifas.repository');
const auditoria = require('../auditoria/auditoria.service');
const env = require('../../config/env');
const { tarifaVigente } = require('../../utils/calculadoraTarifa');

/** Indicadores del panel en vivo del administrador. */
async function dashboard() {
  const espacios = await espaciosRepo.resumen();
  const operativos = espacios.total - espacios.inhabilitados;
  const [hoy, ayer, estadia, porHora, tarifas, reglas, actividad] = await Promise.all([
    repo.ingresosDelDia(0), repo.ingresosDelDia(1), repo.estadiaPromedioHoy(), repo.ocupacionPorHoraHoy(operativos),
    tarifasRepo.listarTarifas(), tarifasRepo.listarReglas(), auditoria.recientes(10),
  ]);
  const ingresosHoy = Number(hoy.ingresos);
  const ingresosAyer = Number(ayer.ingresos);
  const variacion = ingresosAyer > 0 ? Math.round(((ingresosHoy - ingresosAyer) / ingresosAyer) * 100) : null;
  const tarifaAuto = tarifas.find((t) => t.tipo_vehiculo === 'AUTO');

  return {
    espacios,
    ingresos: { hoy: ingresosHoy, ayer: ingresosAyer, variacion, transacciones: hoy.transacciones },
    estadiaPromedioMin: estadia,
    ocupacionPorHora: porHora,
    tarifaVigente: tarifaVigente({ tarifa: tarifaAuto, reglas, ocupacion: espacios.ocupacion, ahora: new Date(), zonaHoraria: env.tzNegocio }),
    actividad,
  };
}

async function resumen(filtros) {
  return { filtros, ...(await repo.resumen(filtros)) };
}

module.exports = { dashboard, resumen };
