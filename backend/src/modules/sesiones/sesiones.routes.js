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
