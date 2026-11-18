/**
 * Módulo Reportes · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./reportes.service');
const auditoria = require('../auditoria/auditoria.service');
const contexto = require('../../utils/contexto');
const { reporteGeneral } = require('../../services/pdf');

async function dashboard(_req, res) { res.json({ ok: true, datos: await servicio.dashboard() }); }

async function resumen(req, res) { res.json({ ok: true, datos: await servicio.resumen(req.validado.query) }); }

async function pdf(req, res) {
  const filtros = req.validado.query;
  const datos = await servicio.resumen(filtros);
  await auditoria.registrar(contexto(req), { accion: 'EXPORTAR_REPORTE', entidad: 'reportes', detalle: filtros });
  reporteGeneral(res, { ...filtros, ...datos });
}

module.exports = { dashboard, resumen, pdf };
