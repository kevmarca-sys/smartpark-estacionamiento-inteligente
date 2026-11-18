const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const servicio = require('../sesiones/sesiones.service');
const { comprobantePago } = require('../../services/pdf');
const AppError = require('../../utils/AppError');

/**
 * Rutas públicas (sin login) para el ticket digital del cliente.
 * El código del ticket es aleatorio, por lo que no se puede adivinar el de otra persona.
 */
const router = Router();
router.use(rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

router.get('/tickets/:codigo', async (req, res) => {
  res.json({ ok: true, datos: await servicio.ticketPublico(req.params.codigo) });
});

router.get('/tickets/:codigo/comprobante', async (req, res) => {
  const sesion = await servicio.detalle(req.params.codigo);
  if (sesion.estado !== 'CERRADA') throw AppError.businessRule('El comprobante estará disponible cuando el ticket sea pagado');
  await comprobantePago(res, sesion);
});

module.exports = router;
