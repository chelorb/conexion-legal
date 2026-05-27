// ============================================================
// src/routes/notificaciones.routes.js
// Endpoints de notificaciones para usuarios + comunicado admin
// ============================================================

const express = require('express');
const router  = express.Router();
const { query } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const notifService = require('../services/notificaciones.service');

router.use(verificarToken);

// GET /api/notificaciones — Mis notificaciones (últimas 30)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tipo, titulo, mensaje, link, leida, creado_en
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY creado_en DESC
       LIMIT 30`,
      [req.usuario.id]
    );
    const noLeidas = rows.filter(n => !n.leida).length;
    res.json({ notificaciones: rows, no_leidas: noLeidas });
  } catch (error) { next(error); }
});

// PATCH /api/notificaciones/:id/leer — Marcar una como leída
router.patch('/:id/leer', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.usuario.id]
    );
    res.json({ ok: true });
  } catch (error) { next(error); }
});

// PATCH /api/notificaciones/leer-todas — Marcar todas como leídas
router.patch('/leer-todas', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
      [req.usuario.id]
    );
    res.json({ ok: true });
  } catch (error) { next(error); }
});

// POST /api/notificaciones/comunicado — Solo admin
// Envía comunicado a: todos | abogados | clientes | usuario específico
router.post('/comunicado', requireRol('admin'), async (req, res, next) => {
  try {
    const { titulo, mensaje, link, destinatario, usuario_id } = req.body;

    if (!titulo?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ error: 'Título y mensaje son obligatorios.' });
    }
    if (!['todos', 'abogados', 'clientes', 'especifico'].includes(destinatario)) {
      return res.status(400).json({ error: 'Destinatario inválido.' });
    }

    let usuarioIds = [];

    if (destinatario === 'especifico') {
      if (!usuario_id) return res.status(400).json({ error: 'Falta usuario_id.' });
      usuarioIds = [usuario_id];
    } else {
      const condicion = destinatario === 'todos'     ? "r.nombre IN ('abogado','cliente')"
                       : destinatario === 'abogados'  ? "r.nombre = 'abogado'"
                       : "r.nombre = 'cliente'";
      const { rows } = await query(
        `SELECT u.id FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE ${condicion} AND u.activo = true`
      );
      usuarioIds = rows.map(r => r.id);
    }

    if (usuarioIds.length === 0) {
      return res.status(400).json({ error: 'No se encontraron destinatarios.' });
    }

    await notifService.comunicadoAdmin({
      usuarioIds,
      titulo:  titulo.trim(),
      mensaje: mensaje.trim(),
      link:    link?.trim() || null,
    });

    res.json({
      mensaje: `Comunicado enviado a ${usuarioIds.length} usuario(s).`,
      enviados: usuarioIds.length,
    });
  } catch (error) { next(error); }
});

module.exports = router;
