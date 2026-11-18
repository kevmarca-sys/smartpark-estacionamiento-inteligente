/**
 * Módulo Tarifas · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./tarifas.service');
const contexto = require('../../utils/contexto');

async function obtener(_req, res) { res.json({ ok: true, ...(await servicio.obtenerConfiguracion()) }); }
async function actualizarTarifa(req, res) {
  res.json({ ok: true, mensaje: 'Tarifa actualizada', datos: await servicio.actualizarTarifa(contexto(req), req.params.tipo.toUpperCase(), req.body) });
}
async function actualizarRegla(req, res) {
  res.json({ ok: true, mensaje: 'Regla actualizada', datos: await servicio.actualizarRegla(contexto(req), req.params.codigo.toUpperCase(), req.body) });
}
async function simular(req, res) { res.json({ ok: true, datos: await servicio.simular(req.body) }); }

module.exports = { obtener, actualizarTarifa, actualizarRegla, simular };
