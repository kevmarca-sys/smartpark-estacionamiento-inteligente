const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./clientes.schemas');
const controlador = require('./clientes.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.listar);
router.get('/:id', controlador.detalle);
router.post('/', validar(s.crearClienteSchema), controlador.crear);            // guardia también puede registrar clientes
router.patch('/:id', autorizar('ADMIN'), validar(s.actualizarClienteSchema), controlador.actualizar);
router.delete('/:id', autorizar('ADMIN'), controlador.eliminar);

module.exports = router;
