// ============================================================
// src/routes/agenda.routes.js
// Agenda de eventos para abogados de la Comunidad
// GET  /api/agenda         → listar eventos próximos
// GET  /api/agenda/:id     → detalle de un evento
// POST /api/agenda/:id/inscribirse → inscribirse a un evento
// POST /api/agenda (admin) → crear nuevo evento
// ============================================================

const express = require('express');
const router  = express.Router();
const { query } = require('../config/database');
const { verificarToken, requireRol, requirePlanFeature } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────
// GET /api/agenda
// Lista todos los eventos próximos — solo plan Comunidad
// ─────────────────────────────────────────────────────────────
router.get('/', verificarToken, requireRol('abogado', 'admin'), async (req, res, next) => {
  try {
    const { mes, año } = req.query;

    // Construir filtro de fecha según mes/año si se envían
    let filtroFecha = 'cc.fecha_evento >= NOW()'; // Por defecto: solo futuros
    const params    = [];

    if (mes && año) {
      filtroFecha = `DATE_TRUNC('month', cc.fecha_evento) = DATE_TRUNC('month', $1::date)`;
      params.push(`${año}-${mes}-01`);
    }

    const paramOffset = params.length + 1;

    const { rows: eventos } = await query(
      `SELECT
         cc.id, cc.tipo, cc.titulo, cc.descripcion,
         cc.autor, cc.especialidad, cc.fecha_evento,
         cc.link_evento, cc.cupos_max, cc.duracion_min,
         cc.miniatura_url, cc.plan_requerido,
         -- Cuántos inscriptos tiene el evento
         COUNT(ie.id) AS inscriptos,
         -- Si el usuario actual está inscripto
         EXISTS(
           SELECT 1 FROM inscripciones_eventos ie2
           WHERE ie2.contenido_id = cc.id AND ie2.usuario_id = $${paramOffset}
         ) AS ya_inscripto
       FROM contenido_campus cc
       LEFT JOIN inscripciones_eventos ie ON cc.id = ie.contenido_id
       WHERE cc.es_evento = true
         AND cc.activo    = true
         AND ${filtroFecha}
       GROUP BY cc.id
       ORDER BY cc.fecha_evento ASC`,
      [...params, req.usuario.id]
    );

    res.json({ eventos });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/agenda/todos
// Lista eventos pasados y futuros — para el calendario completo
// ─────────────────────────────────────────────────────────────
router.get('/todos', verificarToken, requireRol('abogado', 'admin'), async (req, res, next) => {
  try {
    const { rows: eventos } = await query(
      `SELECT
         cc.id, cc.tipo, cc.titulo, cc.descripcion,
         cc.autor, cc.especialidad, cc.fecha_evento,
         cc.link_evento, cc.cupos_max, cc.duracion_min,
         cc.plan_requerido,
         COUNT(ie.id) AS inscriptos,
         EXISTS(
           SELECT 1 FROM inscripciones_eventos ie2
           WHERE ie2.contenido_id = cc.id AND ie2.usuario_id = $1
         ) AS ya_inscripto
       FROM contenido_campus cc
       LEFT JOIN inscripciones_eventos ie ON cc.id = ie.contenido_id
       WHERE cc.es_evento = true AND cc.activo = true
       GROUP BY cc.id
       ORDER BY cc.fecha_evento DESC`,
      [req.usuario.id]
    );
    res.json({ eventos });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/agenda/:id/inscribirse
// El abogado se inscribe a un evento
// ─────────────────────────────────────────────────────────────
router.post('/:id/inscribirse', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    // Verificar que el evento existe y tiene cupos
    const { rows: evento } = await query(
      `SELECT cc.id, cc.titulo, cc.cupos_max, cc.plan_requerido,
              COUNT(ie.id) AS inscriptos
       FROM contenido_campus cc
       LEFT JOIN inscripciones_eventos ie ON cc.id = ie.contenido_id
       WHERE cc.id = $1 AND cc.es_evento = true AND cc.activo = true
       GROUP BY cc.id`,
      [id]
    );

    if (evento.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar cupos disponibles
    if (evento[0].cupos_max && parseInt(evento[0].inscriptos) >= evento[0].cupos_max) {
      return res.status(409).json({ error: 'El evento ya no tiene cupos disponibles.' });
    }

    // Inscribir (UNIQUE previene duplicados)
    await query(
      `INSERT INTO inscripciones_eventos (usuario_id, contenido_id)
       VALUES ($1, $2)`,
      [usuarioId, id]
    );

    res.json({ mensaje: `Inscripto exitosamente a "${evento[0].titulo}".` });

  } catch (error) {
    if (error.code === '23505') { // Violación UNIQUE
      return res.status(409).json({ error: 'Ya estás inscripto a este evento.' });
    }
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/agenda/:id/inscribirse
// El abogado cancela su inscripción
// ─────────────────────────────────────────────────────────────
router.delete('/:id/inscribirse', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM inscripciones_eventos
       WHERE usuario_id = $1 AND contenido_id = $2`,
      [req.usuario.id, req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'No estabas inscripto a este evento.' });
    }

    res.json({ mensaje: 'Inscripción cancelada correctamente.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/agenda (admin)
// Crear un nuevo evento desde el panel de administración
// ─────────────────────────────────────────────────────────────
router.post('/', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const {
      tipo = 'congreso', titulo, descripcion, autor,
      especialidad, fecha_evento, link_evento,
      duracion_min, cupos_max, miniatura_url,
    } = req.body;

    if (!titulo || !fecha_evento) {
      return res.status(400).json({ error: 'El título y la fecha son obligatorios.' });
    }

    const { rows: [evento] } = await query(
      `INSERT INTO contenido_campus (
         tipo, titulo, descripcion, autor, especialidad,
         fecha_evento, link_evento, duracion_min, cupos_max,
         miniatura_url, es_evento, plan_requerido, activo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true, 'comunidad', true)
       RETURNING *`,
      [tipo, titulo, descripcion, autor, especialidad,
       fecha_evento, link_evento, duracion_min, cupos_max, miniatura_url]
    );

    res.status(201).json({
      mensaje: 'Evento creado correctamente.',
      evento,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/agenda/:id (admin)
// Editar un evento existente
// ─────────────────────────────────────────────────────────────
router.put('/:id', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const {
      titulo, descripcion, autor, especialidad,
      fecha_evento, link_evento, duracion_min, cupos_max, activo,
    } = req.body;

    const { rows: [evento] } = await query(
      `UPDATE contenido_campus SET
         titulo       = COALESCE($1, titulo),
         descripcion  = COALESCE($2, descripcion),
         autor        = COALESCE($3, autor),
         especialidad = COALESCE($4, especialidad),
         fecha_evento = COALESCE($5, fecha_evento),
         link_evento  = COALESCE($6, link_evento),
         duracion_min = COALESCE($7, duracion_min),
         cupos_max    = COALESCE($8, cupos_max),
         activo       = COALESCE($9, activo)
       WHERE id = $10 AND es_evento = true
       RETURNING *`,
      [titulo, descripcion, autor, especialidad,
       fecha_evento, link_evento, duracion_min, cupos_max, activo,
       req.params.id]
    );

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    res.json({ mensaje: 'Evento actualizado.', evento });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/agenda/:id (admin)
// Cancelar/eliminar un evento
// ─────────────────────────────────────────────────────────────
router.delete('/:id', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    await query(
      `UPDATE contenido_campus SET activo = false WHERE id = $1 AND es_evento = true`,
      [req.params.id]
    );
    res.json({ mensaje: 'Evento cancelado.' });
  } catch (error) { next(error); }
});

module.exports = router;
