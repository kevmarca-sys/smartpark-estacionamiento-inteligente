const servicio = require('./auditoria.service');

async function listar(req, res) {
  res.json({ ok: true, ...(await servicio.listar(req.query)) });
}

module.exports = { listar };
