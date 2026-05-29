// ============================================================
// src/routes/planes.admin.routes.js
// Gestión completa de planes de suscripción desde el admin
// ============================================================

const express  = require('express');
const router   = express.Router();
const { query } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

// Todos los endpoints requieren ser admin
router.use(verificarToken, requireRol('admin'));

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// Notificar a todos los abogados de un plan (app + email simulado)
async function notificarAbogados(planId, tipo, titulo, mensaje) {
  try {
    // Buscar abogados suscriptos al plan
    const { rows: abogados } = await query(
      `SELECT u.id, u.nombre, u.email
       FROM perfiles_abogado pa
       JOIN usuarios u ON pa.usuario_id = u.id
       WHERE pa.plan_id = $1 AND pa.suscripcion_activa = true`,
      [planId]
    );

    for (const ab of abogados) {
      // Notificación interna
      await query(
        `INSERT INTO notificaciones_plan (usuario_id, plan_id, tipo, titulo, mensaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [ab.id, planId, tipo, titulo, mensaje]
      );
      // Email (si hay servicio configurado)
      try {
        const nodemailer = require('nodemailer');
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });
          await transporter.sendMail({
            from: `"Conexión Legal" <${process.env.EMAIL_USER}>`,
            to: ab.email,
            subject: titulo,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
                <h1 style="font-size:22px;color:#1C1B18;margin-bottom:12px">${titulo}</h1>
                <p style="color:#56534A;line-height:1.6">${mensaje}</p>
                <p style="color:#56534A;line-height:1.6;margin-top:16px">
                  Ingresá a tu panel para ver todos los detalles:
                  <a href="${process.env.FRONTEND_URL}/abogado/suscripcion"
                     style="color:#B86030;font-weight:600">Ver mi suscripción</a>
                </p>
                <p style="color:#B0AEA8;font-size:12px;margin-top:32px">Conexión Legal · Plataforma Legal Digital</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.warn('Email no enviado (SMTP no configurado):', emailErr.message);
      }
    }

    return abogados.length;
  } catch (err) {
    console.error('Error notificando abogados:', err.message);
    return 0;
  }
}

// Encontrar el plan más cercano por precio (para migración)
async function planMasCercano(planId, precio) {
  const { rows } = await query(
    `SELECT id, nombre, CAST(precio_mensual AS FLOAT) AS precio_mensual
     FROM planes_suscripcion
     WHERE id != $1 AND activo = true
     ORDER BY ABS(CAST(precio_mensual AS FLOAT) - $2) ASC
     LIMIT 1`,
    [planId, precio]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/planes-gestion — Listar todos con funcionalidades
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows: planes } = await query(
      `SELECT id, nombre, slug,
              CAST(precio_mensual AS FLOAT) AS precio_mensual,
              CAST(precio_anual   AS FLOAT) AS precio_anual,
              aparece_en_grilla, max_consultas_mes,
              acceso_campus, acceso_campus_completo,
              gestion_turnos, perfil_validado,
              credencial_virtual, networking,
              beneficios_exclusivos, difusion_profesional,
              activo,
              (SELECT COUNT(*) FROM perfiles_abogado pa
               WHERE pa.plan_id = planes_suscripcion.id
               AND pa.suscripcion_activa = true) AS suscriptores
       FROM planes_suscripcion
       ORDER BY precio_mensual ASC`
    );

    // Para cada plan, traer sus funcionalidades custom
    for (const plan of planes) {
      const { rows: funcs } = await query(
        `SELECT id, nombre, icono, orden, activa
         FROM plan_funcionalidades
         WHERE plan_id = $1
         ORDER BY orden ASC`,
        [plan.id]
      );
      plan.funcionalidades_custom = funcs;
    }

    res.json({ planes });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/planes-gestion — Crear nuevo plan
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      nombre, slug, precio_mensual = 0, precio_anual = 0,
      max_consultas_mes = null,
      aparece_en_grilla = true, acceso_campus = false,
      acceso_campus_completo = false, gestion_turnos = true,
      perfil_validado = true, credencial_virtual = false,
      networking = false, beneficios_exclusivos = false,
      difusion_profesional = false,
    } = req.body;

    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    }

    const slugLimpio = slug.trim().toLowerCase().replace(/\s+/g, '-');

    const { rows: [plan] } = await query(
      `INSERT INTO planes_suscripcion (
         nombre, slug, precio_mensual, precio_anual,
         max_consultas_mes, aparece_en_grilla, acceso_campus,
         acceso_campus_completo, gestion_turnos, perfil_validado,
         credencial_virtual, networking, beneficios_exclusivos,
         difusion_profesional, activo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
       RETURNING *`,
      [
        nombre.trim(), slugLimpio,
        parseFloat(precio_mensual), parseFloat(precio_anual),
        max_consultas_mes ? parseInt(max_consultas_mes) : null,
        aparece_en_grilla, acceso_campus, acceso_campus_completo,
        gestion_turnos, perfil_validado, credencial_virtual,
        networking, beneficios_exclusivos, difusion_profesional,
      ]
    );

    res.status(201).json({ mensaje: 'Plan creado.', plan });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un plan con ese slug.' });
    }
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/planes-gestion/:id — Actualizar plan y notificar
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre, precio_mensual, precio_anual, max_consultas_mes,
      aparece_en_grilla, acceso_campus, acceso_campus_completo,
      gestion_turnos, perfil_validado, credencial_virtual,
      networking, beneficios_exclusivos, difusion_profesional, activo,
    } = req.body;

    // Plan antes del cambio (para detectar qué cambió)
    const { rows: [anterior] } = await query(
      `SELECT *, CAST(precio_mensual AS FLOAT) AS precio_mensual_num
       FROM planes_suscripcion WHERE id = $1`,
      [id]
    );
    if (!anterior) return res.status(404).json({ error: 'Plan no encontrado.' });

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
        max_consultas_mes !== undefined
          ? (max_consultas_mes === '' || max_consultas_mes === null ? null : parseInt(max_consultas_mes))
          : anterior.max_consultas_mes,
        aparece_en_grilla ?? null, acceso_campus ?? null,
        acceso_campus_completo ?? null, gestion_turnos ?? null,
        perfil_validado ?? null, credencial_virtual ?? null,
        networking ?? null, beneficios_exclusivos ?? null,
        difusion_profesional ?? null, activo ?? null,
        id,
      ]
    );

    // Detectar qué cambió y armar mensajes de notificación
    const cambios = [];
    const precioAnterior = parseFloat(anterior.precio_mensual);
    const precioNuevo    = parseFloat(precio_mensual ?? anterior.precio_mensual);

    if (Math.abs(precioAnterior - precioNuevo) > 1) {
      cambios.push({
        tipo: 'precio',
        titulo: `Cambio de precio en tu plan ${plan.nombre}`,
        mensaje: `El precio del plan ${plan.nombre} cambió de $${precioAnterior.toLocaleString('es-AR')}/mes a $${precioNuevo.toLocaleString('es-AR')}/mes. Este cambio aplica a partir de tu próxima renovación.`,
      });
    }

    const booleans = ['acceso_campus','acceso_campus_completo','networking','credencial_virtual','beneficios_exclusivos','difusion_profesional'];
    const labeles  = {
      acceso_campus: 'Campus multimedia', acceso_campus_completo: 'Campus completo',
      networking: 'Foro y red profesional', credencial_virtual: 'Credencial virtual',
      beneficios_exclusivos: 'Beneficios exclusivos', difusion_profesional: 'Difusión destacada',
    };

    for (const key of booleans) {
      const antes = anterior[key];
      const ahora = req.body[key] ?? antes;
      if (antes !== ahora) {
        cambios.push({
          tipo: 'funcionalidad',
          titulo: `Actualización en tu plan ${plan.nombre}`,
          mensaje: `La funcionalidad "${labeles[key]}" fue ${ahora ? 'agregada ✅' : 'eliminada ❌'} de tu plan ${plan.nombre}.`,
        });
      }
    }

    // Enviar notificaciones
    let totalNotificados = 0;
    for (const cambio of cambios) {
      const n = await notificarAbogados(parseInt(id), cambio.tipo, cambio.titulo, cambio.mensaje);
      totalNotificados = Math.max(totalNotificados, n);
    }

    res.json({
      mensaje: 'Plan actualizado.',
      plan,
      notificados: totalNotificados,
      cambios: cambios.length,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/planes-gestion/:id — Eliminar plan con migración
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [plan] } = await query(
      `SELECT *, CAST(precio_mensual AS FLOAT) AS pm,
              (SELECT COUNT(*) FROM perfiles_abogado WHERE plan_id = $1 AND suscripcion_activa = true) AS suscriptores
       FROM planes_suscripcion WHERE id = $1`,
      [id]
    );
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });

    const suscriptores = parseInt(plan.suscriptores);

    if (suscriptores > 0) {
      // Migrar al plan más cercano
      const planDestino = await planMasCercano(parseInt(id), plan.pm);
      if (!planDestino) {
        return res.status(400).json({ error: 'No hay otro plan disponible para migrar a los suscriptores.' });
      }

      await query(
        `UPDATE perfiles_abogado SET plan_id = $1 WHERE plan_id = $2`,
        [planDestino.id, id]
      );

      // Notificar a los migrados
      await notificarAbogados(
        planDestino.id,
        'migracion',
        `Tu plan fue cambiado a ${planDestino.nombre}`,
        `El plan "${plan.nombre}" fue eliminado. Tu suscripción fue migrada automáticamente al plan "${planDestino.nombre}" (el más cercano disponible). Revisá los detalles en tu panel.`
      );
    }

    // Borrar el plan
    await query('DELETE FROM planes_suscripcion WHERE id = $1', [id]);

    res.json({
      mensaje: `Plan "${plan.nombre}" eliminado. ${suscriptores} abogado(s) migrado(s).`,
      suscriptores_migrados: suscriptores,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/planes-gestion/:id/funcionalidades — Agregar feature custom
// ─────────────────────────────────────────────────────────────
router.post('/:id/funcionalidades', async (req, res, next) => {
  try {
    const { nombre, icono = '✓', orden = 0 } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre de la funcionalidad es obligatorio.' });
    }
    const { rows: [func] } = await query(
      `INSERT INTO plan_funcionalidades (plan_id, nombre, icono, orden)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, nombre.trim(), icono, orden]
    );

    // Notificar a los suscriptores
    const { rows: [plan] } = await query('SELECT nombre FROM planes_suscripcion WHERE id = $1', [req.params.id]);
    await notificarAbogados(
      parseInt(req.params.id), 'funcionalidad',
      `Nueva funcionalidad en tu plan ${plan?.nombre}`,
      `Se agregó "${nombre.trim()}" a tu plan. ¡Aprovechala desde tu panel!`
    );

    res.status(201).json({ func });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/planes-gestion/funcionalidades/:funcId — Editar feature
// ─────────────────────────────────────────────────────────────
router.put('/funcionalidades/:funcId', async (req, res, next) => {
  try {
    const { nombre, icono, orden, activa } = req.body;
    const { rows: [func] } = await query(
      `UPDATE plan_funcionalidades SET
         nombre = COALESCE($1, nombre),
         icono  = COALESCE($2, icono),
         orden  = COALESCE($3, orden),
         activa = COALESCE($4, activa)
       WHERE id = $5 RETURNING *`,
      [nombre || null, icono || null, orden ?? null, activa ?? null, req.params.funcId]
    );
    if (!func) return res.status(404).json({ error: 'Funcionalidad no encontrada.' });
    res.json({ func });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/planes-gestion/funcionalidades/:funcId
// ─────────────────────────────────────────────────────────────
router.delete('/funcionalidades/:funcId', async (req, res, next) => {
  try {
    await query('DELETE FROM plan_funcionalidades WHERE id = $1', [req.params.funcId]);
    res.json({ mensaje: 'Funcionalidad eliminada.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/planes-gestion/notificaciones — Ver todas las notis enviadas
// ─────────────────────────────────────────────────────────────
router.get('/notificaciones', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT np.*, u.nombre AS abogado_nombre, u.email AS abogado_email,
              ps.nombre AS plan_nombre
       FROM notificaciones_plan np
       JOIN usuarios u ON np.usuario_id = u.id
       LEFT JOIN planes_suscripcion ps ON np.plan_id = ps.id
       ORDER BY np.creado_en DESC
       LIMIT 50`
    );
    res.json({ notificaciones: rows });
  } catch (error) { next(error); }
});

module.exports = router;
