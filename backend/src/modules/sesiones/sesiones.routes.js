/**
 * Módulo Sesiones · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET   /api/sesiones                      Autenticado
 *   POST  /api/sesiones/entrada              ADMIN / GUARDIA
 *   GET   /api/sesiones/:codigo              Autenticado
 *   GET   /api/sesiones/:codigo/cobro        ADMIN / GUARDIA
 *   POST  /api/sesiones/:codigo/salida       ADMIN / GUARDIA
 *   POST  /api/sesiones/:codigo/anular       ADMIN
 *   GET   /api/sesiones/:codigo/comprobante  Autenticado
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./sesiones.schemas');
const controlador = require('./sesiones.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.listar);
router.post('/entrada', autorizar('GUARDIA', 'ADMIN'), validar(s.entradaSchema), controlador.entrada);
router.get('/:codigo', controlador.detalle);
router.get('/:codigo/cobro', autorizar('GUARDIA', 'ADMIN'), controlador.consultarSalida);
router.post('/:codigo/salida', autorizar('GUARDIA', 'ADMIN'), validar(s.salidaSchema), controlador.salida);
router.post('/:codigo/anular', autorizar('ADMIN'), validar(s.anularSchema), controlador.anular);
router.get('/:codigo/comprobante', controlador.comprobante);

module.exports = router;
