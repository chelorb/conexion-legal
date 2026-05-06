// ============================================================
// src/routes/abogados.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/abogados.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const { validarPerfilAbogado } = require('../middleware/validacion.middleware');

// Rutas públicas
router.get('/',                ctrl.listarAbogados);
router.get('/especialidades',  ctrl.listarEspecialidades);
router.get('/:id',             ctrl.obtenerAbogado);

// Rutas privadas (solo abogado autenticado)
router.get('/me/dashboard',  verificarToken, requireRol('abogado'), ctrl.obtenerDashboard);
router.put('/me/perfil',     verificarToken, requireRol('abogado'), validarPerfilAbogado, ctrl.actualizarPerfil);

module.exports = router;


// ============================================================
// src/routes/consultas.routes.js
// ============================================================
