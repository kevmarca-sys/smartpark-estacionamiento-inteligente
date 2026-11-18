/**
 * Módulo Auditoría · Rutas
 *
 * Endpoints del módulo, con el rol requerido para cada uno:
 *
 *   GET  /api/auditoria  ADMIN
 */

const { Router } = require('express');
const { autenticar, autorizar } = require('../../middlewares/auth');
const controlador = require('./auditoria.controller');

const router = Router();
router.get('/', autenticar, autorizar('ADMIN'), controlador.listar);

module.exports = router;
