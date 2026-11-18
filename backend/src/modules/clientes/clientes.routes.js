/**
 * Módulo Clientes · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET     /api/clientes      Autenticado
 *   GET     /api/clientes/:id  Autenticado
 *   POST    /api/clientes      Autenticado
 *   PATCH   /api/clientes/:id  ADMIN
 *   DELETE  /api/clientes/:id  ADMIN
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./clientes.schemas');
const controlador = require('./clientes.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.listar);
router.get('/:id', controlador.detalle);
router.post('/', validar(s.crearClienteSchema), controlador.crear); // También disponible para el guardia
router.patch('/:id', autorizar('ADMIN'), validar(s.actualizarClienteSchema), controlador.actualizar);
router.delete('/:id', autorizar('ADMIN'), controlador.eliminar);

module.exports = router;
