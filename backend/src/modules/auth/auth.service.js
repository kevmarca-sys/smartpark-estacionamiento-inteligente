/**
 * Módulo Autenticación · Servicio
 *
 * Inicio de sesión con bcrypt y emisión del token JWT.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const usuariosRepo = require('../usuarios/usuarios.repository');
const auditoria = require('../auditoria/auditoria.service');

/** Firma el token JWT con el id, el nombre y el rol del usuario. */
function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

/** Valida las credenciales, registra el acceso en la auditoría y devuelve el token. */
async function login({ usuario, password }, ip) {
  const encontrado = await usuariosRepo.buscarPorUsuarioOCorreo(usuario);
  // Mismo mensaje para usuario inexistente o contraseña incorrecta para no revelar cuál de los dos falló.
  const valido = encontrado && (await bcrypt.compare(password, encontrado.password_hash));

  if (!valido) {
    await auditoria.registrar({ ip }, { accion: 'LOGIN_FALLIDO', entidad: 'usuarios', detalle: { usuario } });
    throw AppError.unauthorized('Usuario o contraseña incorrectos');
  }
  if (!encontrado.activo) {
    throw AppError.forbidden('El usuario está desactivado. Contacte al administrador.');
  }

  await usuariosRepo.actualizarUltimoAcceso(encontrado.id);
  const datos = { id: encontrado.id, nombre: encontrado.nombre, usuario: encontrado.usuario, correo: encontrado.correo, rol: encontrado.rol };
  await auditoria.registrar({ usuario: datos, ip }, { accion: 'INICIO_SESION', entidad: 'usuarios', registroId: encontrado.id });

  return { token: generarToken(encontrado), usuario: datos };
}

/** Devuelve los datos del usuario autenticado. */
async function perfil(id) {
  const u = await usuariosRepo.buscarPorId(id);
  if (!u || !u.activo) throw AppError.unauthorized('El usuario ya no está disponible');
  return u;
}

module.exports = { login, perfil };
