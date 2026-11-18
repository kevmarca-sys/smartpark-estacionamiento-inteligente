const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const { rangoSchema } = require('./reportes.schemas');
const controlador = require('./reportes.controller');

const router = Router();
router.use(autenticar, autorizar('ADMIN'));          // el guardia NO puede ver reportes de dinero
router.get('/dashboard', controlador.dashboard);
router.get('/resumen', validar(rangoSchema, 'query'), controlador.resumen);
router.get('/pdf', validar(rangoSchema, 'query'), controlador.pdf);

module.exports = router;
