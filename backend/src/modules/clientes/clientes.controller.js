/**
 * Módulo Clientes · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./clientes.service');
const contexto = require('../../utils/contexto');

async function listar(req, res) { res.json({ ok: true, ...(await servicio.listar(req.query)) }); }
async function detalle(req, res) { res.json({ ok: true, datos: await servicio.detalle(Number(req.params.id)) }); }
async function crear(req, res) {
  res.status(201).json({ ok: true, mensaje: 'Cliente registrado', datos: await servicio.crear(contexto(req), req.body) });
}
async function actualizar(req, res) {
  res.json({ ok: true, mensaje: 'Cliente actualizado', datos: await servicio.actualizar(contexto(req), Number(req.params.id), req.body) });
}
async function eliminar(req, res) {
  await servicio.eliminar(contexto(req), Number(req.params.id));
  res.json({ ok: true, mensaje: 'Cliente eliminado' });
}

module.exports = { listar, detalle, crear, actualizar, eliminar };
