const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('./usuarios.schemas');
const controlador = require('./usuarios.controller');

const router = Router();
router.use(autenticar, autorizar('ADMIN'));
router.get('/', controlador.listar);
router.post('/', validar(crearUsuarioSchema), controlador.crear);
router.patch('/:id', validar(actualizarUsuarioSchema), controlador.actualizar);

module.exports = router;
