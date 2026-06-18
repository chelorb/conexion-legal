// ============================================================
// src/routes/auth.routes.js — Rutas de autenticación
// ============================================================

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const ctrl     = require('../controllers/auth.controller');
const { verificarToken }    = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin } = require('../middleware/validacion.middleware');
const { verificarHCaptcha } = require('../middleware/hcaptcha.middleware');

// ─────────────────────────────────────────────────────────────
// Configuración de Multer para documentos del registro
// Se guardan en uploads/documentos/ con nombre único por usuario
// ─────────────────────────────────────────────────────────────
const dirDocumentos = path.join(__dirname, '../../uploads/documentos');
if (!fs.existsSync(dirDocumentos)) fs.mkdirSync(dirDocumentos, { recursive: true });

const storageDocumentos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirDocumentos),
  filename:    (req, file, cb) => {
    // Nombre: tipo_documento-timestamp-random.ext
    const ext   = path.extname(file.originalname).toLowerCase();
    const nombre = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, nombre);
  },
});

const uploadDocumentos = multer({
  storage: storageDocumentos,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
  fileFilter: (req, file, cb) => {
    // Solo se aceptan PDF e imágenes
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Solo se aceptan archivos PDF, JPG, PNG o WebP.'));
    }
    cb(null, true);
  },
});

// Los tres campos de documentos que puede subir el abogado
const camposDocumentos = uploadDocumentos.fields([
  { name: 'doc_titulo',     maxCount: 1 },
  { name: 'doc_cuil',       maxCount: 1 },
  { name: 'doc_credencial', maxCount: 1 },
]);

// ─────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────

// Registro: multer primero (para parsear multipart/form-data),
// luego captcha, luego validación, luego el controlador
router.post('/registro', camposDocumentos, verificarHCaptcha, validarRegistro, ctrl.registro);

// Login: solo validación (rate limiting aplicado en app.js)
router.post('/login',    validarLogin, ctrl.login);

router.get('/verificar-email',           ctrl.verificarEmail);
router.post('/solicitar-reset-password', ctrl.solicitarResetPassword);
router.post('/reset-password',           ctrl.resetPassword);
router.get('/me', verificarToken,        ctrl.obtenerPerfil);

module.exports = router;
