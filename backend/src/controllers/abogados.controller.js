// ============================================================
// src/controllers/abogados.controller.js
// Endpoints públicos y privados para abogados
// - Búsqueda y listado (público)
// - Gestión de perfil (privado, solo el propio abogado)
// ============================================================

const { query } = require('../config/database');

// ─────────────────────────────────────────────────────────────
// GET /api/abogados
// Listado público de abogados con filtros y paginación
// ─────────────────────────────────────────────────────────────
const listarAbogados = async (req, res, next) => {
  try {
    const {
      especialidad,
      ciudad,
      provincia,
      online,
      plan,
      orden = 'calificacion',
      pagina = 1,
      limite = 12,
    } = req.query;

    const condiciones = ['pa.visible_en_grilla = true', 'u.activo = true'];
    const parametros  = [];
    let paramIndex    = 1;

    if (especialidad) {
      condiciones.push(`$${paramIndex} = ANY(pa.especialidades)`);
      parametros.push(especialidad);
      paramIndex++;
    }
    if (ciudad) {
      condiciones.push(`LOWER(pa.ciudad) LIKE LOWER($${paramIndex})`);
      parametros.push(`%${ciudad}%`);
      paramIndex++;
    }
    if (provincia) {
      condiciones.push(`LOWER(pa.provincia) LIKE LOWER($${paramIndex})`);
      parametros.push(`%${provincia}%`);
      paramIndex++;
    }
    if (online === 'true') {
      condiciones.push('pa.atiende_online = true');
    }
    if (plan) {
      condiciones.push(`ps.slug = $${paramIndex}`);
      parametros.push(plan);
      paramIndex++;
    }

    const ordenMap = {
      calificacion: 'pa.calificacion_promedio DESC, pa.total_calificaciones DESC',
      experiencia:  'pa.anos_experiencia DESC NULLS LAST',
      nombre:       'u.apellido ASC, u.nombre ASC',
    };
    const ordenSQL     = ordenMap[orden] || ordenMap.calificacion;
    const offset       = (parseInt(pagina) - 1) * parseInt(limite);
    const limiteParsed = Math.min(parseInt(limite), 50);
    const whereClause  = condiciones.join(' AND ');

    const { rows: abogados } = await query(
      `SELECT
         u.id, u.nombre, u.apellido, u.avatar_url,
         pa.especialidades, pa.descripcion,
         CAST(pa.anos_experiencia AS INT) AS anos_experiencia,
         pa.ciudad, pa.provincia,
         pa.atiende_online, pa.atiende_presencial,
         CAST(pa.calificacion_promedio AS FLOAT) AS calificacion_promedio,
         CAST(pa.total_calificaciones AS INT) AS total_calificaciones,
         CAST(pa.consultas_completadas AS INT) AS consultas_completadas,
         pa.matricula_verificada, pa.credencial_activa,
         ps.nombre AS plan_nombre, ps.slug AS plan_slug,
         ps.difusion_profesional
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE ${whereClause}
       ORDER BY ps.difusion_profesional DESC, ${ordenSQL}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...parametros, limiteParsed, offset]
    );

    const { rows: conteo } = await query(
      `SELECT COUNT(*) AS total
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE ${whereClause}`,
      parametros
    );

    res.json({
      abogados,
      paginacion: {
        total:         parseInt(conteo[0].total),
        pagina:        parseInt(pagina),
        limite:        limiteParsed,
        total_paginas: Math.ceil(parseInt(conteo[0].total) / limiteParsed),
      }
    });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────
// GET /api/abogados/:id
// Perfil público completo de un abogado
// FIX: se agregaron matricula, universidad, titulo_universitario,
//      anio_graduacion y nro_credencial_letrado al SELECT
// ─────────────────────────────────────────────────────────────
const obtenerAbogado = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT
         u.id, u.nombre, u.apellido, u.avatar_url,
         -- Datos académicos y matrícula
         pa.matricula, pa.matricula_verificada,
         pa.titulo_universitario, pa.universidad, pa.anio_graduacion,
         pa.nro_credencial_letrado,
         -- Datos profesionales
         pa.especialidades, pa.descripcion,
         CAST(pa.anos_experiencia AS INT) AS anos_experiencia,
         -- Ubicación y modalidad
         pa.ciudad, pa.provincia, pa.direccion_consultorio,
         pa.atiende_online, pa.atiende_presencial,
         -- Métricas
         CAST(pa.calificacion_promedio AS FLOAT) AS calificacion_promedio,
         CAST(pa.total_calificaciones AS INT) AS total_calificaciones,
         CAST(pa.consultas_completadas AS INT) AS consultas_completadas,
         -- Plan y credencial
         pa.credencial_activa,
         ps.nombre AS plan_nombre, ps.slug AS plan_slug
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE u.id = $1 AND pa.visible_en_grilla = true AND u.activo = true`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Abogado no encontrado.' });
    }

    // Calificaciones públicas
    const { rows: calificaciones } = await query(
      `SELECT c.puntaje, c.comentario, c.creado_en,
              u.nombre AS cliente_nombre
       FROM calificaciones c
       JOIN usuarios u ON c.cliente_id = u.id
       WHERE c.abogado_id = $1 AND c.publica = true
       ORDER BY c.creado_en DESC
       LIMIT 10`,
      [id]
    );

    res.json({ abogado: rows[0], calificaciones });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/abogados/perfil
// Actualizar el perfil del abogado autenticado
// ─────────────────────────────────────────────────────────────
const actualizarPerfil = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      matricula, especialidades, descripcion, anos_experiencia,
      provincia, ciudad, direccion_consultorio,
      atiende_online, atiende_presencial,
    } = req.body;

    // Actualizar nombre/apellido/teléfono si vienen
    if (req.body.nombre || req.body.apellido || req.body.telefono) {
      const campos = [];
      const vals   = [];
      let idx = 1;
      if (req.body.nombre)   { campos.push(`nombre = $${idx++}`);   vals.push(req.body.nombre); }
      if (req.body.apellido) { campos.push(`apellido = $${idx++}`); vals.push(req.body.apellido); }
      if (req.body.telefono) { campos.push(`telefono = $${idx++}`); vals.push(req.body.telefono); }
      vals.push(usuarioId);
      await query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${idx}`, vals);
    }

    const { rows } = await query(
      `UPDATE perfiles_abogado SET
         matricula             = COALESCE($1, matricula),
         especialidades        = COALESCE($2, especialidades),
         descripcion           = COALESCE($3, descripcion),
         anos_experiencia      = COALESCE($4, anos_experiencia),
         provincia             = COALESCE($5, provincia),
         ciudad                = COALESCE($6, ciudad),
         direccion_consultorio = COALESCE($7, direccion_consultorio),
         atiende_online        = COALESCE($8, atiende_online),
         atiende_presencial    = COALESCE($9, atiende_presencial),
         perfil_completo       = true
       WHERE usuario_id = $10
       RETURNING *`,
      [
        matricula, especialidades, descripcion, anos_experiencia,
        provincia, ciudad, direccion_consultorio,
        atiende_online, atiende_presencial,
        usuarioId,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado.' });

    res.json({ mensaje: 'Perfil actualizado correctamente.', perfil: rows[0] });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────
// GET /api/abogados/dashboard
// Panel principal del abogado autenticado con estadísticas
// ─────────────────────────────────────────────────────────────
const obtenerDashboard = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const [stats, proximas, perfil, notifs] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE estado = 'pendiente')  AS consultas_pendientes,
           COUNT(*) FILTER (WHERE estado = 'confirmada') AS consultas_confirmadas,
           COUNT(*) FILTER (WHERE estado = 'completada'
             AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', NOW())) AS completadas_este_mes,
           COUNT(*) FILTER (WHERE estado = 'cancelada')  AS canceladas_total
         FROM consultas WHERE abogado_id = $1`,
        [usuarioId]
      ),
      query(
        `SELECT c.id, c.tipo, c.fecha_hora, c.estado, c.especialidad,
                u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
                u.telefono AS cliente_telefono
         FROM consultas c
         JOIN usuarios u ON c.cliente_id = u.id
         WHERE c.abogado_id = $1
           AND c.estado IN ('pendiente', 'confirmada')
           AND c.fecha_hora >= NOW()
         ORDER BY c.fecha_hora ASC LIMIT 5`,
        [usuarioId]
      ),
      query(
        `SELECT CAST(pa.calificacion_promedio AS FLOAT) AS calificacion_promedio,
                CAST(pa.total_calificaciones AS INT) AS total_calificaciones,
                pa.suscripcion_activa, pa.suscripcion_fin,
                pa.visible_en_grilla, pa.perfil_completo,
                ps.nombre AS plan_nombre, ps.slug AS plan_slug
         FROM perfiles_abogado pa
         JOIN planes_suscripcion ps ON pa.plan_id = ps.id
         WHERE pa.usuario_id = $1`,
        [usuarioId]
      ),
      query(
        'SELECT COUNT(*) AS no_leidas FROM notificaciones WHERE usuario_id = $1 AND leida = false',
        [usuarioId]
      ),
    ]);

    res.json({
      estadisticas:             stats.rows[0],
      proximas_consultas:       proximas.rows,
      perfil:                   perfil.rows[0],
      notificaciones_no_leidas: parseInt(notifs.rows[0].no_leidas),
    });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────
// GET /api/abogados/especialidades
// ─────────────────────────────────────────────────────────────
const listarEspecialidades = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, nombre, icono FROM especialidades_catalogo WHERE activa = true ORDER BY nombre'
    );
    res.json({ especialidades: rows });
  } catch (error) { next(error); }
};

// Helper: normaliza tipos numéricos
const parsearAbogado = (a) => ({
  ...a,
  calificacion_promedio: parseFloat(a.calificacion_promedio || 0),
  total_calificaciones:  parseInt(a.total_calificaciones    || 0),
  consultas_completadas: parseInt(a.consultas_completadas   || 0),
  anos_experiencia:      parseInt(a.anos_experiencia        || 0),
});

module.exports = {
  listarAbogados,
  obtenerAbogado,
  actualizarPerfil,
  obtenerDashboard,
  listarEspecialidades,
  parsearAbogado,
};
