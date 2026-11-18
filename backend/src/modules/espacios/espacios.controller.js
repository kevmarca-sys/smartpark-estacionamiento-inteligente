/**
 * Módulo Espacios · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./espacios.service');
const contexto = require('../../utils/contexto');

async function listar(req, res) { res.json({ ok: true, ...(await servicio.listar(req.query)) }); }
async function mapa(_req, res) { res.json({ ok: true, ...(await servicio.mapa()) }); }
async function crear(req, res) {
  res.status(201).json({ ok: true, mensaje: 'Espacio creado', datos: await servicio.crear(contexto(req), req.body) });
}
async function actualizar(req, res) {
  res.json({ ok: true, mensaje: 'Espacio actualizado', datos: await servicio.actualizar(contexto(req), Number(req.params.id), req.body) });
}
async function cambiarEstado(req, res) {
  const datos = await servicio.cambiarEstado(contexto(req), Number(req.params.id), req.body);
  res.json({ ok: true, mensaje: `Espacio ${datos.codigo} ${datos.estado === 'LIBRE' ? 'habilitado' : 'inhabilitado'}`, datos });
}
async function eliminar(req, res) {
  await servicio.eliminar(contexto(req), Number(req.params.id));
  res.json({ ok: true, mensaje: 'Espacio eliminado' });
}

module.exports = { listar, mapa, crear, actualizar, cambiarEstado, eliminar };
