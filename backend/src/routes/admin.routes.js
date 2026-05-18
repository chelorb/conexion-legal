// ============================================================
// src/routes/admin.routes.js
// Rutas del panel de administración
// Todas requieren autenticación y rol admin
// ============================================================

const express = require('express');
const router  = express.Router();
const { query } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const emailService = require('../services/email.service');

// Todos los endpoints de admin requieren autenticación y rol admin
router.use(verificarToken, requireRol('admin'));

// ─────────────────────────────────────────────────────────────
// GET /api/admin/estadisticas
// Métricas globales de la plataforma para el dashboard
// ─────────────────────────────────────────────────────────────
router.get('/estadisticas', async (req, res, next) => {
  try {
    // Ejecutar todas las queries en paralelo para mayor velocidad
    const [usuarios, abogados, consultas, pagos, pendientes] = await Promise.all([
      query("SELECT COUNT(*) AS total FROM usuarios WHERE activo = true"),
      query("SELECT COUNT(*) AS total FROM perfiles_abogado WHERE visible_en_grilla = true"),
      query(`SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE estado = 'completada') AS completadas
             FROM consultas`),
      query("SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE mp_status = 'approved'"),
      // Contar abogados pendientes de aprobación
      query("SELECT COUNT(*) AS total FROM perfiles_abogado WHERE estado_aprobacion = 'pendiente'"),
    ]);

    res.json({
      usuarios_activos:      parseInt(usuarios.rows[0].total),
      abogados_visibles:     parseInt(abogados.rows[0].total),
      consultas_totales:     parseInt(consultas.rows[0].total),
      consultas_completadas: parseInt(consultas.rows[0].completadas),
      ingresos_totales:      parseFloat(pagos.rows[0].total),
      abogados_pendientes:   parseInt(pendientes.rows[0].total),
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/usuarios
// Listado de todos los usuarios con sus datos básicos
// ─────────────────────────────────────────────────────────────
router.get('/usuarios', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.activo,
              u.email_verificado, u.creado_en, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       ORDER BY u.creado_en DESC
       LIMIT 200`
    );
    res.json({ usuarios: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/abogados
// Listado de abogados con estado de aprobación
// Soporta filtro por estado: ?estado=pendiente|aprobado|rechazado
// ─────────────────────────────────────────────────────────────
router.get('/abogados', async (req, res, next) => {
  try {
    const { estado } = req.query;

    // Construir condición de filtro dinámica
    const condicion = estado
      ? `WHERE pa.estado_aprobacion = '${estado}'`
      : '';

    const { rows } = await query(
      `SELECT
         u.id, u.nombre, u.apellido, u.email, u.avatar_url, u.creado_en,
         pa.especialidades, pa.descripcion, pa.matricula,
         pa.matricula_verificada, pa.ciudad, pa.provincia,
         pa.calificacion_promedio, pa.total_calificaciones,
         pa.visible_en_grilla, pa.perfil_completo,
         pa.estado_aprobacion, pa.motivo_rechazo,
         pa.aprobado_en,
         ps.nombre AS plan_nombre, ps.slug AS plan_slug
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       ${condicion}
       ORDER BY
         CASE pa.estado_aprobacion
           WHEN 'pendiente'  THEN 1
           WHEN 'aprobado'   THEN 2
           WHEN 'rechazado'  THEN 3
         END,
         u.creado_en DESC
       LIMIT 200`
    );
    res.json({ abogados: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/abogados/:id/aprobar
// Aprobar o rechazar el perfil de un abogado
// Body: { accion: 'aprobar' | 'rechazar', motivo?: string }
// ─────────────────────────────────────────────────────────────
router.patch('/abogados/:id/aprobar', async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { accion, motivo, visible, matricula_verificada } = req.body;
    const adminId    = req.usuario.id;

    // Obtener datos del abogado para los emails
    const { rows: abogadoRows } = await query(
      `SELECT u.nombre, u.apellido, u.email
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       WHERE u.id = $1`,
      [id]
    );

    if (abogadoRows.length === 0) {
      return res.status(404).json({ error: 'Abogado no encontrado.' });
    }

    const abogado = abogadoRows[0];

    // ── Acción: aprobar ──────────────────────────────────────
    if (accion === 'aprobar') {
      await query(
        `UPDATE perfiles_abogado SET
           estado_aprobacion    = 'aprobado',
           visible_en_grilla    = true,
           matricula_verificada = COALESCE($1, matricula_verificada),
           motivo_rechazo       = NULL,
           aprobado_por         = $2,
           aprobado_en          = NOW()
         WHERE usuario_id = $3`,
        [matricula_verificada ?? null, adminId, id]
      );

      // Notificación en la app para el abogado
      await query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
         VALUES ($1, 'perfil_aprobado',
                 '✅ ¡Tu perfil fue aprobado!',
                 'Ya aparecés en la búsqueda de clientes. ¡Bienvenido/a a Conexión Legal!',
                 '/abogado/dashboard')`,
        [id]
      );

      // Email de aprobación al abogado
      emailService.notificarAbogadoAprobado({
        nombre: `${abogado.nombre} ${abogado.apellido}`,
        email:  abogado.email,
      });

      return res.json({ mensaje: 'Perfil aprobado. El abogado fue notificado.' });
    }

    // ── Acción: rechazar ─────────────────────────────────────
    if (accion === 'rechazar') {
      await query(
        `UPDATE perfiles_abogado SET
           estado_aprobacion = 'rechazado',
           visible_en_grilla = false,
           motivo_rechazo    = $1,
           aprobado_por      = $2,
           aprobado_en       = NOW()
         WHERE usuario_id = $3`,
        [motivo || null, adminId, id]
      );

      // Notificación en la app
      await query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
         VALUES ($1, 'perfil_rechazado',
                 'ℹ️ Tu perfil necesita correcciones',
                 $2,
                 '/abogado/perfil')`,
        [id, motivo || 'Por favor revisá tu perfil y completá los datos faltantes.']
      );

      // Email de rechazo con motivo
      emailService.notificarAbogadoRechazado({
        nombre: `${abogado.nombre} ${abogado.apellido}`,
        email:  abogado.email,
        motivo,
      });

      return res.json({ mensaje: 'Perfil rechazado. El abogado fue notificado.' });
    }

    // ── Acción: actualizar visibilidad/verificación (sin cambiar estado) ──
    if (visible !== undefined || matricula_verificada !== undefined) {
      await query(
        `UPDATE perfiles_abogado SET
           visible_en_grilla    = COALESCE($1, visible_en_grilla),
           matricula_verificada = COALESCE($2, matricula_verificada)
         WHERE usuario_id = $3`,
        [visible ?? null, matricula_verificada ?? null, id]
      );
      return res.json({ mensaje: 'Perfil actualizado.' });
    }

    res.status(400).json({ error: 'Acción no válida.' });

  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/usuarios/:id/estado
// Habilitar o deshabilitar una cuenta de usuario
// ─────────────────────────────────────────────────────────────
router.patch('/usuarios/:id/estado', async (req, res, next) => {
  try {
    const { activo } = req.body;

    // Verificar que no se está deshabilitando a sí mismo
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No podés deshabilitar tu propia cuenta.' });
    }

    await query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2',
      [activo, req.params.id]
    );

    res.json({ mensaje: `Usuario ${activo ? 'habilitado' : 'deshabilitado'} correctamente.` });
  } catch (error) { next(error); }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/abogados/:id/perfil
// Editar el perfil completo de un abogado desde el admin
// ─────────────────────────────────────────────────────────────
router.put('/abogados/:id/perfil', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      descripcion, anos_experiencia, ciudad, provincia,
      matricula, especialidades,
    } = req.body;

    await query(
      `UPDATE perfiles_abogado SET
         descripcion      = COALESCE($1, descripcion),
         anos_experiencia = COALESCE($2, anos_experiencia),
         ciudad           = COALESCE($3, ciudad),
         provincia        = COALESCE($4, provincia),
         matricula        = COALESCE($5, matricula),
         especialidades   = COALESCE($6, especialidades),
         perfil_completo  = true
       WHERE usuario_id = $7`,
      [
        descripcion || null,
        anos_experiencia ? parseInt(anos_experiencia) : null,
        ciudad || null,
        provincia || null,
        matricula || null,
        especialidades?.length ? especialidades : null,
        id,
      ]
    );

    res.json({ mensaje: 'Perfil actualizado correctamente.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/campus — Listar todo el contenido del campus
// ─────────────────────────────────────────────────────────────
router.get('/campus', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tipo, titulo, descripcion, autor, especialidad,
              duracion_min, plan_requerido, contenido_url,
              es_evento, activo, creado_en
       FROM contenido_campus
       WHERE es_evento = false
       ORDER BY creado_en DESC`
    );
    res.json({ contenido: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/campus — Crear nuevo contenido
// ─────────────────────────────────────────────────────────────
router.post('/campus', async (req, res, next) => {
  try {
    const {
      tipo, titulo, descripcion, autor, especialidad,
      duracion_min, plan_requerido, contenido_url,
    } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'El título es obligatorio.' });
    }

    const { rows: [item] } = await query(
      `INSERT INTO contenido_campus
         (tipo, titulo, descripcion, autor, especialidad,
          duracion_min, plan_requerido, contenido_url, es_evento, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, false, true)
       RETURNING *`,
      [
        tipo || 'curso', titulo, descripcion || null,
        autor || null, especialidad || null,
        duracion_min || null, plan_requerido || 'comunidad',
        contenido_url || null,
      ]
    );

    res.status(201).json({ mensaje: 'Contenido creado.', item });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/campus/:id — Editar contenido existente
// ─────────────────────────────────────────────────────────────
router.put('/campus/:id', async (req, res, next) => {
  try {
    const {
      tipo, titulo, descripcion, autor, especialidad,
      duracion_min, plan_requerido, contenido_url, activo,
    } = req.body;

    const { rows: [item] } = await query(
      `UPDATE contenido_campus SET
         tipo           = COALESCE($1, tipo),
         titulo         = COALESCE($2, titulo),
         descripcion    = COALESCE($3, descripcion),
         autor          = COALESCE($4, autor),
         especialidad   = COALESCE($5, especialidad),
         duracion_min   = COALESCE($6, duracion_min),
         plan_requerido = COALESCE($7, plan_requerido),
         contenido_url  = COALESCE($8, contenido_url),
         activo         = COALESCE($9, activo)
       WHERE id = $10 AND es_evento = false
       RETURNING *`,
      [
        tipo || null, titulo || null, descripcion || null,
        autor || null, especialidad || null,
        duracion_min || null, plan_requerido || null,
        contenido_url || null, activo ?? null,
        req.params.id,
      ]
    );

    if (!item) return res.status(404).json({ error: 'Contenido no encontrado.' });
    res.json({ mensaje: 'Contenido actualizado.', item });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/campus/:id — Desactivar contenido
// ─────────────────────────────────────────────────────────────
router.delete('/campus/:id', async (req, res, next) => {
  try {
    await query(
      'UPDATE contenido_campus SET activo = false WHERE id = $1',
      [req.params.id]
    );
    res.json({ mensaje: 'Contenido desactivado.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// LINKS DE INTERÉS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/links — Listar todos (admin)
router.get('/links', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM links_interes ORDER BY orden ASC, creado_en ASC'
    );
    res.json({ links: rows });
  } catch (error) { next(error); }
});

// GET pública (sin auth) — para mostrar en el dashboard del abogado
// La registramos también en app.js como ruta pública
module.exports.linksPublicos = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, titulo, url, descripcion FROM links_interes WHERE activo = true ORDER BY orden ASC'
    );
    res.json({ links: rows });
  } catch (error) { next(error); }
};

// POST /api/admin/links — Crear link
router.post('/links', async (req, res, next) => {
  try {
    const { titulo, url, descripcion, orden } = req.body;
    if (!titulo || !url) {
      return res.status(400).json({ error: 'Título y URL son obligatorios.' });
    }
    const { rows: [link] } = await query(
      `INSERT INTO links_interes (titulo, url, descripcion, orden)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [titulo, url, descripcion || null, orden || 0]
    );
    res.status(201).json({ link });
  } catch (error) { next(error); }
});

// PUT /api/admin/links/:id — Editar link
router.put('/links/:id', async (req, res, next) => {
  try {
    const { titulo, url, descripcion, orden, activo } = req.body;
    const { rows: [link] } = await query(
      `UPDATE links_interes SET
         titulo      = COALESCE($1, titulo),
         url         = COALESCE($2, url),
         descripcion = COALESCE($3, descripcion),
         orden       = COALESCE($4, orden),
         activo      = COALESCE($5, activo)
       WHERE id = $6 RETURNING *`,
      [titulo, url, descripcion, orden, activo ?? null, req.params.id]
    );
    if (!link) return res.status(404).json({ error: 'Link no encontrado.' });
    res.json({ link });
  } catch (error) { next(error); }
});

// DELETE /api/admin/links/:id — Eliminar link
router.delete('/links/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM links_interes WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Link eliminado.' });
  } catch (error) { next(error); }
});
