// ============================================================
// src/routes/auth.routes.js
// Rutas de autenticación — documentos van a Cloudinary
// ============================================================

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const ctrl       = require('../controllers/auth.controller');
const { verificarToken }                = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin } = require('../middleware/validacion.middleware');

// Multer en memoria — los archivos van directo a Cloudinary, no al disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.'));
  },
});

const uploadDocs = upload.fields([
  { name: 'doc_credencial', maxCount: 1 },
  { name: 'doc_titulo',     maxCount: 1 },
  { name: 'doc_cuil',       maxCount: 1 },
]);

// ── Rutas ─────────────────────────────────────────────────────
router.post('/registro',                 uploadDocs, validarRegistro, ctrl.registro);
router.post('/login',                    validarLogin,                ctrl.login);
router.get('/verificar-email',                                        ctrl.verificarEmail);
router.post('/reenviar-verificacion',                                 ctrl.reenviarVerificacion);
router.post('/solicitar-reset-password',                              ctrl.solicitarResetPassword);
router.post('/reset-password',                                        ctrl.resetPassword);
router.get('/me',                        verificarToken,              ctrl.obtenerPerfil);

module.exports = router;
