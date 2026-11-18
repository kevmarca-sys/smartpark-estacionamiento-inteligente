const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const controlador = require('./auditoria.controller');

const router = Router();
router.get('/', autenticar, autorizar('ADMIN'), controlador.listar);

module.exports = router;
