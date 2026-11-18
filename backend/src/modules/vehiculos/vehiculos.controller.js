const servicio = require('./vehiculos.service');
const contexto = require('../../utils/contexto');

async function listar(req, res) { res.json({ ok: true, ...(await servicio.listar(req.query)) }); }
async function detalle(req, res) { res.json({ ok: true, datos: await servicio.detalle(req.params.placa) }); }
async function crear(req, res) {
  res.status(201).json({ ok: true, mensaje: 'Vehículo registrado', datos: await servicio.crear(contexto(req), req.body) });
}
async function actualizar(req, res) {
  res.json({ ok: true, mensaje: 'Vehículo actualizado', datos: await servicio.actualizar(contexto(req), Number(req.params.id), req.body) });
}

module.exports = { listar, detalle, crear, actualizar };
