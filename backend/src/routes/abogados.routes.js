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

// GET /api/abogados/me/notificaciones-plan — Notificaciones de cambios de plan no leídas
router.get('/me/notificaciones-plan', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tipo, titulo, mensaje, leida, creado_en
       FROM notificaciones_plan
       WHERE usuario_id = $1
       ORDER BY creado_en DESC
       LIMIT 20`,
      [req.usuario.id]
    );
    res.json({ notificaciones: rows });
  } catch (error) { next(error); }
});

// PATCH /api/abogados/me/notificaciones-plan/:id/leida — Marcar como leída
router.patch('/me/notificaciones-plan/:id/leida', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    await query(
      `UPDATE notificaciones_plan SET leida = true
       WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Notificación marcada como leída.' });
  } catch (error) { next(error); }
});

// PATCH /api/abogados/me/notificaciones-plan/marcar-todas — Marcar todas como leídas
router.patch('/me/notificaciones-plan/marcar-todas', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    await query(
      `UPDATE notificaciones_plan SET leida = true WHERE usuario_id = $1`,
      [req.usuario.id]
    );
    res.json({ mensaje: 'Todas marcadas como leídas.' });
  } catch (error) { next(error); }
});
