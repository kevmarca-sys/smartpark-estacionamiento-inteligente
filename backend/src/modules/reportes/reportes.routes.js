/**
 * Módulo Reportes · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET  /api/reportes/dashboard  ADMIN
 *   GET  /api/reportes/resumen    ADMIN
 *   GET  /api/reportes/pdf        ADMIN
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const { rangoSchema } = require('./reportes.schemas');
const controlador = require('./reportes.controller');

const router = Router();
// Los reportes de ingresos son exclusivos del administrador.
router.use(autenticar, autorizar('ADMIN'));
router.get('/dashboard', controlador.dashboard);
router.get('/resumen', validar(rangoSchema, 'query'), controlador.resumen);
router.get('/pdf', validar(rangoSchema, 'query'), controlador.pdf);

module.exports = router;
