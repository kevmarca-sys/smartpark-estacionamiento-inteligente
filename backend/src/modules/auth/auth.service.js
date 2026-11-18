const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const usuariosRepo = require('../usuarios/usuarios.repository');
const auditoria = require('../auditoria/auditoria.service');

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

async function login({ usuario, password }, ip) {
  const encontrado = await usuariosRepo.buscarPorUsuarioOCorreo(usuario);
  // Mismo mensaje para usuario inexistente o contraseña incorrecta (no revelar cuál falló)
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

async function perfil(id) {
  const u = await usuariosRepo.buscarPorId(id);
  if (!u || !u.activo) throw AppError.unauthorized('El usuario ya no está disponible');
  return u;
}

module.exports = { login, perfil };
