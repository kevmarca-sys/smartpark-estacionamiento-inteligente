/**
 * Módulo Usuarios · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./usuarios.service');
const contexto = require('../../utils/contexto');

async function listar(req, res) {
  res.json({ ok: true, ...(await servicio.listar(req.query)) });
}
async function crear(req, res) {
  res.status(201).json({ ok: true, mensaje: 'Usuario creado', datos: await servicio.crear(contexto(req), req.body) });
}
async function actualizar(req, res) {
  res.json({ ok: true, mensaje: 'Usuario actualizado', datos: await servicio.actualizar(contexto(req), Number(req.params.id), req.body) });
}

module.exports = { listar, crear, actualizar };
