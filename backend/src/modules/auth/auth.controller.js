/**
 * Módulo Autenticación · Controlador
 *
 * Recibe la petición HTTP, delega en el servicio y devuelve la respuesta JSON.
 */

const servicio = require('./auth.service');
const auditoria = require('../auditoria/auditoria.service');
const contexto = require('../../utils/contexto');
const { describirDispositivo } = require('../../utils/dispositivo');

async function login(req, res) {
  const resultado = await servicio.login(req.body, req.ip, req.get('user-agent'));
  res.json({ ok: true, ...resultado });
}

async function perfil(req, res) {
  res.json({ ok: true, usuario: await servicio.perfil(req.usuario.id) });
}

async function logout(req, res) {
  await auditoria.registrar(contexto(req), {
    accion: 'CIERRE_SESION', entidad: 'usuarios', registroId: req.usuario.id,
    detalle: { rol: req.usuario.rol, dispositivo: describirDispositivo(req.get('user-agent')) },
  });
  res.json({ ok: true, mensaje: 'Sesión cerrada' });
}

module.exports = { login, perfil, logout };
