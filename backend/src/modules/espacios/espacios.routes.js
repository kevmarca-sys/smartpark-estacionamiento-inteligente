/**
 * Módulo Espacios · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET     /api/espacios             Autenticado
 *   GET     /api/espacios/mapa        Autenticado
 *   POST    /api/espacios             ADMIN
 *   PUT     /api/espacios/:id         ADMIN
 *   PATCH   /api/espacios/:id/estado  ADMIN
 *   DELETE  /api/espacios/:id         ADMIN
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./espacios.schemas');
const controlador = require('./espacios.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.listar);
router.get('/mapa', controlador.mapa);
router.post('/', autorizar('ADMIN'), validar(s.crearEspacioSchema), controlador.crear);
router.put('/:id', autorizar('ADMIN'), validar(s.actualizarEspacioSchema), controlador.actualizar);
router.patch('/:id/estado', autorizar('ADMIN'), validar(s.cambiarEstadoSchema), controlador.cambiarEstado);
router.delete('/:id', autorizar('ADMIN'), controlador.eliminar);

module.exports = router;
