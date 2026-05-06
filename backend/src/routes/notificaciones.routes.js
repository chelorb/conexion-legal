// ============================================================
// src/routes/notificaciones.routes.js
// ============================================================
const expressN = require('express');
const routerN  = expressN.Router();
const { query: nQuery } = require('../config/database');
const { verificarToken } = require('../middleware/auth.middleware');

// Listar notificaciones del usuario
routerN.get('/', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await nQuery(
      `SELECT id, tipo, titulo, mensaje, leida, link, creado_en
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY creado_en DESC
       LIMIT 50`,
      [req.usuario.id]
    );
    res.json({ notificaciones: rows });
  } catch (error) {
    next(error);
  }
});

// Marcar como leídas
routerN.patch('/leer-todas', verificarToken, async (req, res, next) => {
  try {
    await nQuery('UPDATE notificaciones SET leida = true WHERE usuario_id = $1', [req.usuario.id]);
    res.json({ mensaje: 'Notificaciones marcadas como leídas.' });
  } catch (error) {
    next(error);
  }
});

module.exports = routerN;


