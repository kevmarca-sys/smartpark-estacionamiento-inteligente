const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const s = require('./tarifas.schemas');
const controlador = require('./tarifas.controller');

const router = Router();
router.use(autenticar);
router.get('/', controlador.obtener);                       // admin y guardia (ver tarifa vigente)
router.put('/reglas/:codigo', autorizar('ADMIN'), validar(s.reglaSchema), controlador.actualizarRegla);
router.post('/simular', autorizar('ADMIN'), validar(s.simularSchema), controlador.simular);
router.put('/:tipo', autorizar('ADMIN'), validar(s.tarifaSchema), controlador.actualizarTarifa);

module.exports = router;
