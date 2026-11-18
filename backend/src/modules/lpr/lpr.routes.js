const { Router } = require('express');
const multer = require('multer');
const { autenticar, autorizar } = require('../../middlewares/auth');
const { leerPlaca } = require('../../services/lpr');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const contexto = require('../../utils/contexto');
const env = require('../../config/env');

const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, archivo, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.mimetype)) return cb(AppError.badRequest('La imagen debe ser JPG, PNG o WEBP'));
    return cb(null, true);
  },
});

const router = Router();
router.use(autenticar, autorizar('GUARDIA', 'ADMIN'));

router.get('/estado', (_req, res) => {
  res.json({ ok: true, datos: { configurado: Boolean(env.plateRecognizer.token) } });
});

/** Recibe la foto tomada con la cámara y devuelve la placa leída. */
router.post('/leer', subir.single('imagen'), async (req, res) => {
  if (!req.file) throw AppError.badRequest('Envíe la imagen de la placa en el campo "imagen"');
  const lectura = await leerPlaca(req.file.buffer, req.file.mimetype);
  // En modo automático solo se auditan las lecturas confiables (evita llenar la auditoría)
  if (req.query.modo !== 'auto' || lectura.confiable) {
    await auditoria.registrar(contexto(req), {
      accion: 'LECTURA_PLACA', entidad: 'lpr', registroId: lectura.placa,
      detalle: { confianza: lectura.confianza, confiable: lectura.confiable, modo: req.query.modo === 'auto' ? 'AUTOMATICO' : 'MANUAL' },
    });
  }
  res.json({ ok: true, datos: lectura });
});

module.exports = router;
