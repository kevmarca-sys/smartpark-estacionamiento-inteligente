const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./vehiculos.schemas');
const controlador = require('./vehiculos.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.listar);
router.get('/:placa', controlador.detalle);
router.post('/', validar(s.crearVehiculoSchema), controlador.crear);
router.patch('/:id', autorizar('ADMIN'), validar(s.actualizarVehiculoSchema), controlador.actualizar);

module.exports = router;
