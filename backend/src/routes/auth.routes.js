// ============================================================
// src/routes/auth.routes.js — Rutas de autenticación
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin } = require('../middleware/validacion.middleware');

router.post('/registro',                 validarRegistro, ctrl.registro);
router.post('/login',                    validarLogin,    ctrl.login);
router.get('/verificar-email',                            ctrl.verificarEmail);
router.post('/solicitar-reset-password',                  ctrl.solicitarResetPassword);
router.post('/reset-password',                            ctrl.resetPassword);
router.get('/me',                        verificarToken,  ctrl.obtenerPerfil);

module.exports = router;
