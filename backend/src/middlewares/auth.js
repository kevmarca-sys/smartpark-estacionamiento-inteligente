/**
 * Middlewares de autenticación y autorización
 *
 * autenticar: valida el token JWT de cada petición.
 * autorizar:  restringe una ruta a uno o más roles (ADMIN, GUARDIA).
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Verifica el token JWT enviado en el encabezado Authorization: Bearer <token>.
 * Si es válido deja los datos del usuario en req.usuario.
 */
function autenticar(req, _res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Debe iniciar sesión para acceder a este recurso'));
  }

  try {
    const datos = jwt.verify(token, env.jwtSecret);
    req.usuario = { id: datos.sub, nombre: datos.nombre, rol: datos.rol };
    return next();
  } catch (error) {
    const mensaje = error.name === 'TokenExpiredError'
      ? 'La sesión expiró, vuelva a iniciar sesión'
      : 'Token inválido';
    return next(AppError.unauthorized(mensaje));
  }
}

/**
 * Autorización por roles. Los permisos se verifican SIEMPRE en el backend.
 * Uso: router.put('/tarifas', autenticar, autorizar('ADMIN'), ...)
 */
function autorizar(...rolesPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario) return next(AppError.unauthorized());
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(AppError.forbidden(`Acceso denegado: esta acción requiere el rol ${rolesPermitidos.join(' o ')}`));
    }
    return next();
  };
}

module.exports = { autenticar, autorizar };
