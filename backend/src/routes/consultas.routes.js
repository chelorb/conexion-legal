// ============================================================
// src/routes/consultas.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/consultas.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const { validarConsulta } = require('../middleware/validacion.middleware');

router.post('/',           verificarToken, requireRol('cliente'),            validarConsulta, ctrl.crearConsulta);
router.get('/',            verificarToken, requireRol('abogado', 'cliente'),                  ctrl.listarConsultas);
router.patch('/:id/estado',verificarToken, requireRol('abogado', 'cliente', 'admin'),         ctrl.actualizarEstadoConsulta);

module.exports = router;
