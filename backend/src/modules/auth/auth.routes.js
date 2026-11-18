/**
 * Módulo Autenticación · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   POST  /api/auth/login   Público
 *   GET   /api/auth/perfil  Autenticado
 *   POST  /api/auth/logout  Autenticado
 */

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validar = require('../../middlewares/validar');
const { autenticar } = require('../../middlewares/auth');
const { loginSchema } = require('./auth.schemas');
const controlador = require('./auth.controller');

// Protección contra fuerza bruta: máximo 10 intentos de inicio de sesión cada 5 minutos por IP.
const limiteLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos de inicio de sesión. Espere 5 minutos.' } },
});

const router = Router();
router.post('/login', limiteLogin, validar(loginSchema), controlador.login);
router.get('/perfil', autenticar, controlador.perfil);
router.post('/logout', autenticar, controlador.logout);

module.exports = router;
