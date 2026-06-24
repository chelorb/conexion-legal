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
              u.email_verificado, u.creado_en, r.nombre AS rol,
              -- Para abogados: traer estado de aprobación
              pa.estado_aprobacion, pa.visible_en_grilla
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN perfiles_abogado pa ON u.id = pa.usuario_id
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
         u.id, u.nombre, u.apellido, u.email, u.avatar_url, u.creado_en, u.telefono,
         pa.especialidades, pa.descripcion, pa.matricula,
         pa.matricula_verificada, pa.ciudad, pa.provincia,
         pa.calificacion_promedio, pa.total_calificaciones,
         pa.visible_en_grilla, pa.perfil_completo,
         pa.estado_aprobacion, pa.motivo_rechazo,
         pa.aprobado_en,
         pa.cuil, pa.titulo_universitario, pa.universidad,
         pa.anio_graduacion, pa.nro_credencial_letrado,
         pa.doc_credencial_url, pa.doc_titulo_url, pa.doc_cuil_url,
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

      // Notificación real-time + email
      const notifService = require('../services/notificaciones.service');
      await notifService.perfilAprobado({
        abogadoId:     id,
        abogadoNombre: `${abogado.nombre} ${abogado.apellido}`,
      });

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

      // Notificación real-time + email
      const notifService = require('../services/notificaciones.service');
      await notifService.perfilRechazado({
        abogadoId: id,
        motivo:    motivo || 'Por favor revisá tu perfil y completá los datos faltantes.',
      });

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

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/usuarios/:id
// Eliminar definitivamente un usuario y todos sus datos
// Solo funciona con clientes y abogados — los admins no se pueden eliminar
// Los datos eliminados NO se pueden recuperar
// ─────────────────────────────────────────────────────────────
router.delete('/usuarios/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (id === req.usuario.id) {
      return res.status(400).json({ error: 'No podés eliminar tu propia cuenta.' });
    }

    // Verificar que el usuario existe y no es admin
    const { rows: [usuario] } = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (usuario.rol === 'admin') {
      return res.status(403).json({ error: 'No se puede eliminar una cuenta de administrador.' });
    }

    // Eliminar el usuario — el CASCADE en la BD elimina todo lo relacionado:
    // perfiles_abogado, consultas, calificaciones, notificaciones, etc.
    await query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({
      mensaje: `Usuario ${usuario.nombre} ${usuario.apellido} eliminado definitivamente.`,
    });
  } catch (error) { next(error); }
});


// ─────────────────────────────────────────────────────────────
// PUT /api/admin/abogados/:id/perfil
// Editar el perfil completo de un abogado desde el admin
// ─────────────────────────────────────────────────────────────
router.put('/abogados/:id/perfil', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      descripcion, anos_experiencia, ciudad, provincia,
      matricula, especialidades, plan_slug,
    } = req.body;

    // Si viene plan_slug, buscar el plan_id correspondiente
    let planId = null;
    if (plan_slug) {
      const { rows: planRows } = await query(
        'SELECT id FROM planes_suscripcion WHERE slug = $1 AND activo = true',
        [plan_slug]
      );
      if (planRows.length === 0) {
        return res.status(400).json({ error: 'Plan no encontrado o inactivo.' });
      }
      planId = planRows[0].id;
    }

    await query(
      `UPDATE perfiles_abogado SET
         descripcion      = COALESCE($1, descripcion),
         anos_experiencia = COALESCE($2, anos_experiencia),
         ciudad           = COALESCE($3, ciudad),
         provincia        = COALESCE($4, provincia),
         matricula        = COALESCE($5, matricula),
         especialidades   = COALESCE($6, especialidades),
         plan_id          = COALESCE($7, plan_id),
         perfil_completo  = true
       WHERE usuario_id = $8`,
      [
        descripcion || null,
        anos_experiencia ? parseInt(anos_experiencia) : null,
        ciudad || null,
        provincia || null,
        matricula || null,
        especialidades?.length ? especialidades : null,
        planId,
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

// ─────────────────────────────────────────────────────────────
// GESTIÓN DE PLANES (Admin)
// ─────────────────────────────────────────────────────────────

// GET /api/admin/planes — Listar todos los planes
router.get('/planes', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, nombre, slug,
              CAST(precio_mensual AS FLOAT) AS precio_mensual,
              CAST(precio_anual AS FLOAT) AS precio_anual,
              aparece_en_grilla, max_consultas_mes,
              acceso_campus, acceso_campus_completo,
              gestion_turnos, perfil_validado,
              credencial_virtual, networking,
              beneficios_exclusivos, difusion_profesional,
              activo
       FROM planes_suscripcion
       ORDER BY precio_mensual ASC`
    );
    res.json({ planes: rows });
  } catch (error) { next(error); }
});

// PUT /api/admin/planes/:id — Actualizar un plan
// Al modificar el precio, notifica automáticamente a todos los abogados
// suscriptos a ese plan (notificación in-app + email informativo)
router.put('/planes/:id', async (req, res, next) => {
  try {
    const {
      nombre, precio_mensual, precio_anual,
      max_consultas_mes,
      aparece_en_grilla, acceso_campus, acceso_campus_completo,
      gestion_turnos, perfil_validado, credencial_virtual,
      networking, beneficios_exclusivos, difusion_profesional,
      activo,
    } = req.body;

    // Guardar los precios actuales ANTES del UPDATE para comparar después
    const { rows: [planAnterior] } = await query(
      'SELECT nombre, precio_mensual, precio_anual FROM planes_suscripcion WHERE id = $1',
      [req.params.id]
    );

    const { rows: [plan] } = await query(
      `UPDATE planes_suscripcion SET
         nombre                 = COALESCE($1,  nombre),
         precio_mensual         = COALESCE($2,  precio_mensual),
         precio_anual           = COALESCE($3,  precio_anual),
         max_consultas_mes      = $4,
         aparece_en_grilla      = COALESCE($5,  aparece_en_grilla),
         acceso_campus          = COALESCE($6,  acceso_campus),
         acceso_campus_completo = COALESCE($7,  acceso_campus_completo),
         gestion_turnos         = COALESCE($8,  gestion_turnos),
         perfil_validado        = COALESCE($9,  perfil_validado),
         credencial_virtual     = COALESCE($10, credencial_virtual),
         networking             = COALESCE($11, networking),
         beneficios_exclusivos  = COALESCE($12, beneficios_exclusivos),
         difusion_profesional   = COALESCE($13, difusion_profesional),
         activo                 = COALESCE($14, activo),
         actualizado_en         = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        nombre || null,
        precio_mensual !== undefined ? parseFloat(precio_mensual) : null,
        precio_anual   !== undefined ? parseFloat(precio_anual)   : null,
        max_consultas_mes !== undefined ? (max_consultas_mes === '' || max_consultas_mes === null ? null : parseInt(max_consultas_mes)) : undefined,
        aparece_en_grilla      ?? null,
        acceso_campus          ?? null,
        acceso_campus_completo ?? null,
        gestion_turnos         ?? null,
        perfil_validado        ?? null,
        credencial_virtual     ?? null,
        networking             ?? null,
        beneficios_exclusivos  ?? null,
        difusion_profesional   ?? null,
        activo                 ?? null,
        req.params.id,
      ]
    );

    if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });

    // ── Notificar cambio de precios si el precio mensual o anual cambió ──
    // Se hace en background para no bloquear la respuesta al admin
    const cambioPrecioMensual = precio_mensual !== undefined &&
      parseFloat(precio_mensual) !== parseFloat(planAnterior?.precio_mensual);
    const cambioPrecioAnual   = precio_anual !== undefined &&
      parseFloat(precio_anual)   !== parseFloat(planAnterior?.precio_anual);

    if (planAnterior && (cambioPrecioMensual || cambioPrecioAnual)) {
      // Buscar todos los abogados activos suscriptos a este plan
      query(
        `SELECT u.id, u.nombre, u.apellido, u.email
         FROM usuarios u
         JOIN perfiles_abogado pa ON pa.usuario_id = u.id
         WHERE pa.plan_id = $1
           AND pa.suscripcion_activa = true
           AND u.activo = true`,
        [req.params.id]
      ).then(async ({ rows: abogados }) => {
        if (abogados.length === 0) return;

        const notifService  = require('../services/notificaciones.service');
        const emailService  = require('../services/email.service');
        const planNombreActual = plan.nombre || planAnterior.nombre;

        for (const abogado of abogados) {
          // Notificación in-app (campana)
          notifService.crear({
            usuarioId: abogado.id,
            tipo:      'cambio_plan',
            titulo:    `Actualización de precios — Plan ${planNombreActual}`,
            mensaje:   `Actualizamos los valores del plan ${planNombreActual}. Tu suscripción activa no se ve afectada hasta la próxima renovación.`,
            link:      '/abogado/suscripcion',
          }).catch(err => console.error(`❌ Notif cambio precio abogado ${abogado.id}:`, err.message));

          // Email informativo
          emailService.notificarCambioPreciosPlan({
            nombre:                abogado.nombre,
            email:                 abogado.email,
            planNombre:            planNombreActual,
            precioMensualAnterior: parseFloat(planAnterior.precio_mensual),
            precioMensualNuevo:    cambioPrecioMensual ? parseFloat(precio_mensual) : parseFloat(planAnterior.precio_mensual),
            precioAnualAnterior:   parseFloat(planAnterior.precio_anual),
            precioAnualNuevo:      cambioPrecioAnual   ? parseFloat(precio_anual)   : parseFloat(planAnterior.precio_anual),
          }).catch(err => console.error(`❌ Email cambio precio abogado ${abogado.email}:`, err.message));
        }

        console.log(`📋 Notificación de cambio de precios enviada a ${abogados.length} abogado(s) del plan ${planNombreActual}`);
      }).catch(err => console.error('❌ Error buscando abogados para notificación de precio:', err.message));
    }

    res.json({ mensaje: 'Plan actualizado correctamente.', plan });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/usuarios/:id/datos — Editar datos personales
// ─────────────────────────────────────────────────────────────
router.patch('/usuarios/:id/datos', async (req, res, next) => {
  try {
    const { nombre, apellido, email, telefono } = req.body;
    const { rows: [usuario] } = await query(
      `UPDATE usuarios SET
         nombre   = COALESCE($1, nombre),
         apellido = COALESCE($2, apellido),
         email    = COALESCE($3, email),
         telefono = COALESCE($4, telefono)
       WHERE id = $5
       RETURNING id, nombre, apellido, email, telefono`,
      [nombre || null, apellido || null, email || null, telefono || null, req.params.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ mensaje: 'Datos actualizados.', usuario });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ese email ya está en uso por otro usuario.' });
    }
    next(err);
  }
});

// ============================================================
// GESTIÓN DEL FORO (Admin)
// Permite al admin administrar categorías e hilos del foro
// ============================================================

// ─────────────────────────────────────────────────────────────
// GET /api/admin/foro/resumen
// Contadores generales del foro para el panel admin
// ─────────────────────────────────────────────────────────────
router.get('/foro/resumen', async (req, res, next) => {
  try {
    const { rows: [totales] } = await query(`
      SELECT
        (SELECT COUNT(*) FROM foro_categorias)                   AS total_categorias,
        (SELECT COUNT(*) FROM foro_hilos)                        AS total_hilos,
        (SELECT COUNT(*) FROM foro_hilos WHERE cerrado = true)   AS hilos_cerrados,
        (SELECT COUNT(*) FROM foro_hilos WHERE fijado  = true)   AS hilos_fijados,
        (SELECT COUNT(*) FROM foro_respuestas)                   AS total_respuestas
    `);
    res.json({ resumen: totales });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/foro/categorias
// Lista todas las categorías (activas e inactivas) con conteo de hilos
// ─────────────────────────────────────────────────────────────
router.get('/foro/categorias', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        fc.id, fc.nombre, fc.descripcion, fc.icono,
        fc.orden, fc.activa, fc.creado_en,
        COUNT(fh.id) AS total_hilos
      FROM foro_categorias fc
      LEFT JOIN foro_hilos fh ON fc.id = fh.categoria_id
      GROUP BY fc.id
      ORDER BY fc.orden ASC
    `);
    res.json({ categorias: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/foro/categorias
// Crear una nueva categoría del foro
// ─────────────────────────────────────────────────────────────
router.post('/foro/categorias', async (req, res, next) => {
  try {
    const { nombre, descripcion, icono, orden } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
    }

    const { rows: [categoria] } = await query(
      `INSERT INTO foro_categorias (nombre, descripcion, icono, orden)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, descripcion, icono, orden, activa`,
      [nombre.trim(), descripcion?.trim() || null, icono?.trim() || '💬', orden || 0]
    );

    res.status(201).json({ mensaje: 'Categoría creada.', categoria });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/foro/categorias/:id
// Editar una categoría existente
// ─────────────────────────────────────────────────────────────
router.put('/foro/categorias/:id', async (req, res, next) => {
  try {
    const { nombre, descripcion, icono, orden } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const { rows: [categoria] } = await query(
      `UPDATE foro_categorias
       SET nombre = $1, descripcion = $2, icono = $3, orden = $4
       WHERE id = $5
       RETURNING id, nombre, descripcion, icono, orden, activa`,
      [nombre.trim(), descripcion?.trim() || null, icono?.trim() || '💬', orden || 0, req.params.id]
    );

    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ mensaje: 'Categoría actualizada.', categoria });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/foro/categorias/:id/pausar
// Activar o pausar una categoría (los hilos quedan pero no se ven)
// Body: { activa: true | false }
// ─────────────────────────────────────────────────────────────
router.patch('/foro/categorias/:id/pausar', async (req, res, next) => {
  try {
    const { activa } = req.body;

    const { rows: [categoria] } = await query(
      `UPDATE foro_categorias SET activa = $1 WHERE id = $2
       RETURNING id, nombre, activa`,
      [activa, req.params.id]
    );

    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });

    res.json({
      mensaje: `Categoría ${activa ? 'activada' : 'pausada'}.`,
      categoria,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/foro/categorias/:id
// Eliminar una categoría junto con todos sus hilos y respuestas (CASCADE)
// ─────────────────────────────────────────────────────────────
router.delete('/foro/categorias/:id', async (req, res, next) => {
  try {
    const { rows: [categoria] } = await query(
      'SELECT id, nombre FROM foro_categorias WHERE id = $1',
      [req.params.id]
    );

    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });

    await query('DELETE FROM foro_categorias WHERE id = $1', [req.params.id]);

    res.json({ mensaje: `Categoría "${categoria.nombre}" eliminada junto con todos sus hilos.` });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/foro/hilos
// Lista todos los hilos con filtros opcionales y paginación
// Query params: ?categoria_id=X &cerrado=true &busqueda=texto &pagina=1
// ─────────────────────────────────────────────────────────────
router.get('/foro/hilos', async (req, res, next) => {
  try {
    const { categoria_id, cerrado, busqueda } = req.query;
    const pagina  = parseInt(req.query.pagina) || 1;
    const limite  = 25;
    const offset  = (pagina - 1) * limite;

    // Construir filtros dinámicamente para evitar SQL injection
    const condiciones = [];
    const valores     = [];

    if (categoria_id) {
      valores.push(categoria_id);
      condiciones.push(`fh.categoria_id = $${valores.length}`);
    }
    if (cerrado !== undefined && cerrado !== '') {
      valores.push(cerrado === 'true');
      condiciones.push(`fh.cerrado = $${valores.length}`);
    }
    if (busqueda?.trim()) {
      valores.push(`%${busqueda.trim()}%`);
      condiciones.push(`fh.titulo ILIKE $${valores.length}`);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Total de resultados para paginación
    const { rows: [{ total }] } = await query(
      `SELECT COUNT(*) AS total FROM foro_hilos fh ${where}`,
      valores
    );

    // Hilos con datos del autor y categoría
    const valoresPag = [...valores, limite, offset];
    const { rows: hilos } = await query(
      `SELECT
         fh.id, fh.titulo, fh.vistas, fh.fijado, fh.cerrado,
         fh.creado_en, fh.actualizado_en,
         fc.nombre AS categoria_nombre, fc.icono AS categoria_icono,
         u.nombre   AS autor_nombre,
         u.apellido AS autor_apellido,
         COUNT(fr.id) AS total_respuestas
       FROM foro_hilos fh
       LEFT JOIN foro_categorias fc ON fh.categoria_id = fc.id
       LEFT JOIN usuarios u         ON fh.autor_id = u.id
       LEFT JOIN foro_respuestas fr ON fh.id = fr.hilo_id
       ${where}
       GROUP BY fh.id, fc.nombre, fc.icono, u.nombre, u.apellido
       ORDER BY fh.actualizado_en DESC
       LIMIT $${valoresPag.length - 1} OFFSET $${valoresPag.length}`,
      valoresPag
    );

    res.json({
      hilos,
      paginacion: {
        total:   parseInt(total),
        pagina,
        limite,
        paginas: Math.ceil(parseInt(total) / limite),
      },
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/foro/hilos/:id/cerrar
// Cerrar o reabrir un hilo (los hilos cerrados no aceptan respuestas)
// Body: { cerrado: true | false }
// ─────────────────────────────────────────────────────────────
router.patch('/foro/hilos/:id/cerrar', async (req, res, next) => {
  try {
    const { cerrado } = req.body;

    const { rows: [hilo] } = await query(
      `UPDATE foro_hilos SET cerrado = $1 WHERE id = $2
       RETURNING id, titulo, cerrado`,
      [cerrado, req.params.id]
    );

    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });

    res.json({
      mensaje: `Hilo ${cerrado ? 'cerrado' : 'reabierto'}.`,
      hilo,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/foro/hilos/:id/fijar
// Fijar o desfijar un hilo (los fijados aparecen primero)
// Body: { fijado: true | false }
// ─────────────────────────────────────────────────────────────
router.patch('/foro/hilos/:id/fijar', async (req, res, next) => {
  try {
    const { fijado } = req.body;

    const { rows: [hilo] } = await query(
      `UPDATE foro_hilos SET fijado = $1 WHERE id = $2
       RETURNING id, titulo, fijado`,
      [fijado, req.params.id]
    );

    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });

    res.json({
      mensaje: `Hilo ${fijado ? 'fijado' : 'desfijado'}.`,
      hilo,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/foro/hilos/:id
// Eliminar un hilo y todas sus respuestas (CASCADE en la BD)
// ─────────────────────────────────────────────────────────────
router.delete('/foro/hilos/:id', async (req, res, next) => {
  try {
    const { rows: [hilo] } = await query(
      'SELECT id, titulo FROM foro_hilos WHERE id = $1',
      [req.params.id]
    );

    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });

    await query('DELETE FROM foro_hilos WHERE id = $1', [req.params.id]);

    res.json({ mensaje: `Hilo "${hilo.titulo}" eliminado.` });
  } catch (error) { next(error); }
});

// ============================================================
// CONFIGURACIÓN DE LA PLATAFORMA (Admin)
// Permite al admin gestionar parámetros globales como el
// número de WhatsApp para grupos de la comunidad
// ============================================================

// ─────────────────────────────────────────────────────────────
// GET /api/admin/config
// Obtener toda la configuración de la plataforma
// ─────────────────────────────────────────────────────────────
router.get('/config', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT clave, valor, descripcion, actualizado_en FROM config_plataforma ORDER BY clave ASC'
    );
    // Convertir a objeto clave-valor para facilidad de uso
    const config = rows.reduce((acc, row) => {
      acc[row.clave] = { valor: row.valor, descripcion: row.descripcion, actualizado_en: row.actualizado_en };
      return acc;
    }, {});
    res.json({ config });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/config/:clave
// Actualizar un valor de configuración
// Body: { valor: '5492984123456' }
// ─────────────────────────────────────────────────────────────
router.put('/config/:clave', async (req, res, next) => {
  try {
    const { clave } = req.params;
    const { valor }  = req.body;

    // Upsert: actualiza si existe, inserta si no
    const { rows: [config] } = await query(
      `INSERT INTO config_plataforma (clave, valor, actualizado_en)
       VALUES ($1, $2, NOW())
       ON CONFLICT (clave)
       DO UPDATE SET valor = $2, actualizado_en = NOW()
       RETURNING clave, valor, actualizado_en`,
      [clave, valor ?? '']
    );

    res.json({ mensaje: 'Configuración actualizada.', config });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/usuarios/:id/permitir-reregistro
// Permite que un abogado rechazado pueda volver a registrarse
// con el mismo email. Estrategia: anonimizar el email actual
// agregando un sufijo único, para liberar el email pero
// conservar el historial completo del usuario en la BD.
// ─────────────────────────────────────────────────────────────
router.patch('/usuarios/:id/permitir-reregistro', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe y es un abogado rechazado
    const { rows: [usuario] } = await query(
      `SELECT u.id, u.email, u.nombre, u.apellido, r.nombre AS rol,
              pa.estado_aprobacion
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       WHERE u.id = $1`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (usuario.rol !== 'abogado') {
      return res.status(400).json({ error: 'Esta acción solo aplica para abogados.' });
    }

    if (usuario.estado_aprobacion !== 'rechazado') {
      return res.status(400).json({
        error: 'Solo se puede permitir el re-registro de abogados rechazados.',
      });
    }

    // Anonimizar el email con un sufijo único basado en timestamp
    // Ej: juan@email.com → juan@email.com__rechazado_1718000000000
    const emailAnonimizado = `${usuario.email}__rechazado_${Date.now()}`;

    await query(
      `UPDATE usuarios SET
         email              = $1,
         activo             = false,
         token_verificacion = NULL,
         token_reset_pass   = NULL
       WHERE id = $2`,
      [emailAnonimizado, id]
    );

    res.json({
      mensaje: `El email "${usuario.email}" fue liberado. El abogado puede volver a registrarse con ese email.`,
      email_liberado: usuario.email,
    });
  } catch (error) { next(error); }
});

module.exports = router;
