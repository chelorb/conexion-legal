// ============================================================
// src/routes/auth.routes.js
// Rutas de autenticación: registro, login, verificación, reset
// ============================================================

const express    = require('express');
const router     = express.Router();
const path       = require('path');
const fs         = require('fs');
const multer     = require('multer');
const ctrl       = require('../controllers/auth.controller');
const { verificarToken }                    = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin }     = require('../middleware/validacion.middleware');

// ── Multer para documentos de abogados ───────────────────────
const uploadDir = path.join(__dirname, '../../uploads/documentos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}_${file.fieldname}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.'));
  },
});

const uploadDocs = upload.fields([
  { name: 'doc_credencial', maxCount: 1 },
  { name: 'doc_titulo',     maxCount: 1 },
  { name: 'doc_cuil',       maxCount: 1 },
]);

// ── Rutas ─────────────────────────────────────────────────────
router.post('/registro',                uploadDocs, validarRegistro, ctrl.registro);
router.post('/login',                   validarLogin,                ctrl.login);
router.get('/verificar-email',                                       ctrl.verificarEmail);
router.post('/reenviar-verificacion',                                ctrl.reenviarVerificacion);
router.post('/solicitar-reset-password',                             ctrl.solicitarResetPassword);
router.post('/reset-password',                                       ctrl.resetPassword);
router.get('/me',                       verificarToken,              ctrl.obtenerPerfil);

module.exports = router;
