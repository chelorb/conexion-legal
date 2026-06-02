// ============================================================
// src/routes/disponibilidad.routes.js
// Gestión de disponibilidad semanal del abogado
// ============================================================

const express   = require('express');
const router    = express.Router();
const { query } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────
// GET /api/disponibilidad/abogado/:id
// Slots disponibles de un abogado (público — lo usa el cliente)
// ─────────────────────────────────────────────────────────────
router.get('/abogado/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, dia_semana, hora_inicio, modalidad
       FROM disponibilidad_abogado
       WHERE abogado_id = $1 AND activo = true
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [req.params.id]
    );
    res.json({ disponibilidad: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/disponibilidad/me
// Mi disponibilidad completa (abogado autenticado)
// ─────────────────────────────────────────────────────────────
router.get('/me', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, dia_semana, hora_inicio, modalidad, activo
       FROM disponibilidad_abogado
       WHERE abogado_id = $1
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [req.usuario.id]
    );
    res.json({ disponibilidad: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/disponibilidad/me
// Agregar un slot de disponibilidad
// ─────────────────────────────────────────────────────────────
router.post('/me', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { dia_semana, hora_inicio, modalidad = 'ambas' } = req.body;

    if (!dia_semana || !hora_inicio) {
      return res.status(400).json({ error: 'Día y hora son obligatorios.' });
    }

    if (dia_semana < 1 || dia_semana > 7) {
      return res.status(400).json({ error: 'El día debe ser entre 1 (Lunes) y 7 (Domingo).' });
    }

    const { rows: [slot] } = await query(
      `INSERT INTO disponibilidad_abogado (abogado_id, dia_semana, hora_inicio, modalidad)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (abogado_id, dia_semana, hora_inicio)
       DO UPDATE SET modalidad = $4, activo = true
       RETURNING *`,
      [req.usuario.id, dia_semana, hora_inicio, modalidad]
    );

    res.status(201).json({ slot });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/disponibilidad/me/bulk
// Guardar toda la disponibilidad de una vez (reemplaza todo)
// ─────────────────────────────────────────────────────────────
router.put('/me/bulk', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { slots } = req.body; // [{ dia_semana, hora_inicio, modalidad }]

    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'Se esperaba un array de slots.' });
    }

    // Eliminar todos los slots actuales y recrear
    await query(
      'DELETE FROM disponibilidad_abogado WHERE abogado_id = $1',
      [req.usuario.id]
    );

    if (slots.length > 0) {
      const values = slots.map((s, i) =>
        `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`
      ).join(', ');

      const params = [req.usuario.id];
      slots.forEach(s => {
        params.push(s.dia_semana, s.hora_inicio, s.modalidad || 'ambas');
      });

      await query(
        `INSERT INTO disponibilidad_abogado (abogado_id, dia_semana, hora_inicio, modalidad)
         VALUES ${values}`,
        params
      );
    }

    res.json({ mensaje: 'Disponibilidad guardada correctamente.', total: slots.length });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/disponibilidad/me/:id
// Eliminar un slot específico
// ─────────────────────────────────────────────────────────────
router.delete('/me/:id', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    await query(
      'DELETE FROM disponibilidad_abogado WHERE id = $1 AND abogado_id = $2',
      [req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Slot eliminado.' });
  } catch (error) { next(error); }
});

module.exports = router;
