// ============================================================
// src/routes/auth.routes.js — Rutas de autenticación
// ============================================================

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/auth.controller');
const { verificarToken }    = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin } = require('../middleware/validacion.middleware');
const { verificarHCaptcha } = require('../middleware/hcaptcha.middleware');

// Registro: primero valida el captcha, luego valida los campos, luego registra
router.post('/registro', verificarHCaptcha, validarRegistro, ctrl.registro);

// Login: solo validación de campos (el rate limiting ya está en app.js)
router.post('/login',    validarLogin, ctrl.login);

router.get('/verificar-email',           ctrl.verificarEmail);
router.post('/solicitar-reset-password', ctrl.solicitarResetPassword);
router.post('/reset-password',           ctrl.resetPassword);
router.get('/me', verificarToken,        ctrl.obtenerPerfil);

module.exports = router;
