// ============================================================
// src/routes/pagos.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pagos.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

// GET /planes — activo: el abogado necesita ver los planes disponibles
router.get('/planes', ctrl.listarPlanes);

// GET /historial — activo: solo lee la tabla pagos de la DB, sin dependencia de MP
router.get('/historial', verificarToken, requireRol('abogado'), ctrl.historialPagos);

// ── Endpoints de MercadoPago — DESHABILITADOS hasta activar los pagos ──────
// Descomentar cuando se configure MP en producción
// router.post('/crear-preferencia', verificarToken, requireRol('abogado'), ctrl.crearPreferencia);
// router.post('/webhook',                                                   ctrl.webhook);

module.exports = router;


