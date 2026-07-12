// ============================================================
// src/routes/abogados.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/abogados.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const { validarPerfilAbogado } = require('../middleware/validacion.middleware');
const { query } = require('../config/database'); // necesario para rutas de notificaciones-plan
const rateLimit   = require('express-rate-limit');
const multer      = require('multer');
const streamifier = require('streamifier');
const cloudinary  = require('cloudinary').v2;

// Cloudinary para el avatar del perfil
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Multer en memoria para procesar FormData (avatar + campos de texto)
const uploadPerfil = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    cb(tipos.includes(file.mimetype) ? null : new Error('Solo JPG, PNG o WebP.'), tipos.includes(file.mimetype));
  },
});

// Rate limiting para solicitudes de cambio de plan
// Máximo 3 solicitudes por hora por IP — evita spam al admin
const limiterSolicitudPlan = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hora
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            () => process.env.NODE_ENV === 'development',
  message: { error: 'Demasiadas solicitudes de cambio de plan. Intentá de nuevo en una hora.' },
});

// Rate limiting para reenvío de verificación de email
// Máximo 3 reenvíos por hora por IP — evita abuso del sistema de emails
const limiterReenvioEmail = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hora
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            () => process.env.NODE_ENV === 'development',
  message: { error: 'Demasiados reenvíos. Intentá de nuevo en una hora.' },
});


// Rutas públicas
router.get('/',                ctrl.listarAbogados);
router.get('/especialidades',  ctrl.listarEspecialidades);
router.get('/:id',             ctrl.obtenerAbogado);

// Rutas privadas (solo abogado autenticado)
router.get('/me/dashboard',  verificarToken, requireRol('abogado'), ctrl.obtenerDashboard);
// PUT /me/perfil — multer necesario para procesar FormData (campos de texto + avatar opcional)
router.put('/me/perfil',
  verificarToken,
  requireRol('abogado'),
  uploadPerfil.single('avatar'), // procesa FormData; req.body queda disponible para el controller
  async (req, res, next) => {
    // Si viene avatar, subirlo a Cloudinary y agregar la URL al body
    if (req.file) {
      try {
        const avatarUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder:        'iustixium/avatars',
              public_id:     `avatar_${req.usuario.id}`,
              overwrite:     true,
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto' }],
            },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        // Guardar la URL del avatar en la tabla usuarios
        await query('UPDATE usuarios SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.usuario.id]);
        req.body.avatar_url = avatarUrl;
      } catch (err) {
        console.error('❌ Error subiendo avatar:', err.message);
      }
    }
    next();
  },
  ctrl.actualizarPerfil
);

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

// ─────────────────────────────────────────────────────────────
// POST /api/abogados/me/solicitar-cambio-plan
// El abogado solicita cambiar su plan — no lo cambia automáticamente.
// Guarda el plan solicitado en la DB y notifica al admin (in-app + email)
// para que lo procese manualmente desde el panel de administración.
// ─────────────────────────────────────────────────────────────
router.post('/me/solicitar-cambio-plan', limiterSolicitudPlan, verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { plan_id } = req.body;
    const abogadoId   = req.usuario.id;

    if (!plan_id) {
      return res.status(400).json({ error: 'Falta el plan solicitado.' });
    }

    // Verificar que el plan solicitado existe y está activo
    const { rows: [planSolicitado] } = await query(
      'SELECT id, nombre FROM planes_suscripcion WHERE id = $1 AND activo = true',
      [plan_id]
    );
    if (!planSolicitado) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    // Obtener el perfil actual del abogado (plan actual + datos personales)
    const { rows: [perfil] } = await query(
      `SELECT pa.plan_id, pa.plan_solicitado_id,
              ps.nombre AS plan_actual_nombre,
              u.nombre, u.apellido, u.email
       FROM perfiles_abogado pa
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       JOIN usuarios u ON u.id = pa.usuario_id
       WHERE pa.usuario_id = $1`,
      [abogadoId]
    );

    if (!perfil) {
      return res.status(404).json({ error: 'Perfil de abogado no encontrado.' });
    }

    // Evitar solicitar el mismo plan que ya tiene activo
    if (perfil.plan_id === parseInt(plan_id)) {
      return res.status(400).json({ error: 'Ya tenés este plan activo.' });
    }

    // Evitar solicitar el mismo plan que ya está solicitado
    if (perfil.plan_solicitado_id === parseInt(plan_id)) {
      return res.status(400).json({ error: 'Ya tenés una solicitud pendiente para este plan.' });
    }

    // Guardar la solicitud en la DB
    await query(
      `UPDATE perfiles_abogado
       SET plan_solicitado_id = $1,
           plan_solicitado_en = NOW()
       WHERE usuario_id = $2`,
      [plan_id, abogadoId]
    );

    // Notificar a todos los admins (in-app + email) en background
    const emailService = require('../services/email.service');
    const { query: dbQuery } = require('../config/database');

    dbQuery(
      `SELECT u.id, u.nombre, u.email
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE r.nombre = 'admin' AND u.activo = true`
    ).then(async ({ rows: admins }) => {
      const notifService = require('../services/notificaciones.service');

      for (const admin of admins) {
        // Notificación in-app
        notifService.crear({
          usuarioId: admin.id,
          tipo:      'cambio_plan_solicitado',
          titulo:    `Solicitud de cambio de plan`,
          mensaje:   `Dr./Dra. ${perfil.nombre} ${perfil.apellido} solicita cambiar del plan ${perfil.plan_actual_nombre} al plan ${planSolicitado.nombre}.`,
          link:      '/admin/abogados',
        }).catch(err => console.error('❌ Notif solicitud plan admin:', err.message));

        // Email al admin
        emailService.notificarAdminSolicitudCambioPlan({
          adminEmail:           admin.email,
          adminNombre:          admin.nombre,
          abogadoNombre:        `${perfil.nombre} ${perfil.apellido}`,
          abogadoEmail:         perfil.email,
          planActualNombre:     perfil.plan_actual_nombre,
          planSolicitadoNombre: planSolicitado.nombre,
        }).catch(err => console.error(`❌ Email solicitud plan a ${admin.email}:`, err.message));
      }

      console.log(`📋 Solicitud de cambio de plan: ${perfil.nombre} ${perfil.apellido} → ${planSolicitado.nombre}`);

      // Registrar en auditoría
      const auditar = require('../services/auditoria.service');
      auditar(req, {
        accion:        'abogado_solicito_cambio_plan',
        descripcion:   `Solicitó cambio del plan ${perfil.plan_actual_nombre} al plan ${planSolicitado.nombre}`,
        entidad:       'perfil_abogado',
        entidad_id:    abogadoId,
        datos_despues: { plan_solicitado: planSolicitado.nombre, plan_solicitado_id: plan_id },
      }).catch(() => {});
    }).catch(err => console.error('❌ Error notificando admins:', err.message));

    res.json({
      mensaje: `Solicitud de cambio al plan ${planSolicitado.nombre} enviada correctamente. El equipo de IUSTIXIUM la procesará a la brevedad.`,
      plan_solicitado: planSolicitado,
    });

  } catch (error) { next(error); }
});

module.exports = router;

