// ============================================================
// src/routes/pagos.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pagos.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

router.get('/planes',                                                    ctrl.listarPlanes);
router.post('/crear-preferencia', verificarToken, requireRol('abogado'), ctrl.crearPreferencia);
router.get('/historial',          verificarToken, requireRol('abogado'), ctrl.historialPagos);
router.post('/webhook',                                                   ctrl.webhook); // Público para MP

module.exports = router;


