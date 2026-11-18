/** Datos del usuario y la IP para auditoría. */
function contexto(req) {
  return { usuario: req.usuario, ip: req.ip };
}
module.exports = contexto;
