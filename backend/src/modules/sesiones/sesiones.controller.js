const servicio = require('./sesiones.service');
const contexto = require('../../utils/contexto');
const { comprobantePago } = require('../../services/pdf');
const AppError = require('../../utils/AppError');

async function listar(req, res) { res.json({ ok: true, ...(await servicio.listar(req.query)) }); }

async function entrada(req, res) {
  const datos = await servicio.registrarEntrada(contexto(req), req.body);
  res.status(201).json({ ok: true, mensaje: `Entrada registrada · espacio ${datos.sesion.espacio}`, datos });
}

async function consultarSalida(req, res) {
  res.json({ ok: true, datos: await servicio.consultarSalida(req.params.codigo) });
}

async function salida(req, res) {
  const datos = await servicio.registrarSalida(contexto(req), req.params.codigo, req.body);
  res.json({ ok: true, mensaje: `Pago registrado · espacio ${datos.sesion.espacio} liberado`, datos });
}

async function anular(req, res) {
  const datos = await servicio.anular(contexto(req), req.params.codigo.toUpperCase(), req.body);
  res.json({ ok: true, mensaje: 'Sesión anulada y espacio liberado', datos });
}

async function detalle(req, res) { res.json({ ok: true, datos: await servicio.detalle(req.params.codigo) }); }

async function comprobante(req, res) {
  const sesion = await servicio.detalle(req.params.codigo);
  if (sesion.estado !== 'CERRADA') throw AppError.businessRule('El comprobante solo está disponible para tickets pagados');
  await comprobantePago(res, sesion);
}

module.exports = { listar, entrada, consultarSalida, salida, anular, detalle, comprobante };
