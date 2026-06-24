// ============================================================
// src/routes/notificaciones.routes.js
// Endpoints de notificaciones para usuarios + comunicado admin
// ============================================================

const express      = require('express');
const router       = express.Router();
const { query }    = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const notifService  = require('../services/notificaciones.service');
const emailService  = require('../services/email.service');

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
router.post('/comunicado', requireRol('admin'), async (req, res, next) => {
  try {
    const { titulo, mensaje, link, destinatario, usuario_id, usuario_ids } = req.body;

    if (!titulo?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ error: 'Título y mensaje son obligatorios.' });
    }
    if (!['todos', 'abogados', 'clientes', 'especifico'].includes(destinatario)) {
      return res.status(400).json({ error: 'Destinatario inválido.' });
    }

    let usuarioIds = [];

    if (destinatario === 'especifico') {
      // Acepta array (usuario_ids) o id único (usuario_id) para retrocompatibilidad
      if (Array.isArray(usuario_ids) && usuario_ids.length > 0) {
        usuarioIds = usuario_ids;
      } else if (usuario_id) {
        usuarioIds = [usuario_id];
      } else {
        return res.status(400).json({ error: 'Seleccioná al menos un usuario.' });
      }
    } else {
      const condicion = destinatario === 'todos'
        ? "r.nombre IN ('abogado','cliente')"
        : destinatario === 'abogados'
          ? "r.nombre = 'abogado'"
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

    // Notificación in-app (Socket.io + DB)
    await notifService.comunicadoAdmin({
      usuarioIds,
      titulo:  titulo.trim(),
      mensaje: mensaje.trim(),
      link:    link?.trim() || null,
    });

    // Email a cada destinatario (en background — no bloquea la respuesta)
    Promise.allSettled(
      usuarioIds.map(async (uid) => {
        try {
          const { rows: [u] } = await query(
            'SELECT nombre, email FROM usuarios WHERE id = $1', [uid]
          );
          if (u) {
            await emailService.enviarComunicado({
              destinatarioEmail:  u.email,
              destinatarioNombre: u.nombre,
              titulo:  titulo.trim(),
              mensaje: mensaje.trim(),
              link:    link?.trim() || null,
            });
          }
        } catch {}
      })
    );

    res.json({
      mensaje:  `Comunicado enviado a ${usuarioIds.length} usuario(s).`,
      enviados: usuarioIds.length,
    });
  } catch (error) { next(error); }
});

module.exports = router;
