/**
 * Módulo Tarifas · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET   /api/tarifas                 Autenticado
 *   PUT   /api/tarifas/reglas/:codigo  ADMIN
 *   POST  /api/tarifas/simular         ADMIN
 *   PUT   /api/tarifas/:tipo           ADMIN
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./tarifas.schemas');
const controlador = require('./tarifas.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.obtener); // Ambos roles consultan la tarifa vigente
router.put('/reglas/:codigo', autorizar('ADMIN'), validar(s.reglaSchema), controlador.actualizarRegla);
router.post('/simular', autorizar('ADMIN'), validar(s.simularSchema), controlador.simular);
router.put('/:tipo', autorizar('ADMIN'), validar(s.tarifaSchema), controlador.actualizarTarifa);

module.exports = router;
