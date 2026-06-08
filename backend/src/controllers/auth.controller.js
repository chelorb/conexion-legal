// ============================================================
// src/controllers/auth.controller.js
// Maneja registro, login, verificación de email y reset de contraseña
// Incluye el flujo de aprobación para abogados nuevos
// ============================================================

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const emailService  = require('../services/email.service');
const cloudSvc      = require('../services/cloudinary.service');
const notifService  = require('../services/notificaciones.service');

// ─────────────────────────────────────────────────────────────
// Genera un JWT firmado con los datos del usuario
// ─────────────────────────────────────────────────────────────
const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/registro
// Registra un nuevo usuario — cliente o abogado
// Los abogados quedan en estado "pendiente" hasta ser aprobados
// ─────────────────────────────────────────────────────────────
const registro = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      nombre, apellido, email, password,
      rol = 'cliente', telefono,
      // Campos extra para abogados
      dni_cuit, cuil, titulo_universitario, universidad,
      anio_graduacion, nro_credencial_letrado,
    } = req.body;

    // Teléfono obligatorio para abogados
    if (rol === 'abogado' && !telefono?.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El teléfono es obligatorio para abogados.' });
    }

    // Verificar que el email no esté ya registrado
    const emailExistente = await client.query(
      'SELECT id FROM usuarios WHERE email = $1', [email]
    );
    if (emailExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El email ya está registrado en la plataforma.' });
    }

    // Obtener el ID del rol
    const rolResult = await client.query(
      'SELECT id FROM roles WHERE nombre = $1', [rol]
    );
    if (rolResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Rol inválido.' });
    }
    const rolId = rolResult.rows[0].id;

    const passwordHash     = await bcrypt.hash(password, 12);
    const tokenVerificacion = uuidv4();

    // Crear el usuario
    const { rows: [usuario] } = await client.query(
      `INSERT INTO usuarios
         (nombre, apellido, email, password_hash, rol_id, telefono, token_verificacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, apellido, email`,
      [nombre, apellido, email, passwordHash, rolId, telefono || null, tokenVerificacion]
    );

    const nuevoUsuarioId = usuario.id;
    // ── Si es abogado: crear perfil con datos de documentación ──
    if (rol === 'abogado') {
      const planDefault = await client.query(
        `SELECT id FROM planes_suscripcion
         WHERE activo = true ORDER BY precio_mensual ASC LIMIT 1`
      );
      const planId = planDefault.rows[0]?.id;
      if (!planId) throw new Error('No hay planes disponibles en el sistema.');

      // URLs de archivos subidos (si los hay)
      // Subir documentos a Cloudinary (almacenamiento permanente y seguro)
      const subirDoc = async (file, tipo) => {
        if (!file) return null;
        try {
          const resultado = await cloudSvc.subirArchivo(file.buffer, {
            folder:        `conexion-legal/abogados/${nuevoUsuarioId}`,
            public_id:     `${tipo}_${Date.now()}`,
            resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
          });
          return resultado.url;
        } catch (err) {
          console.warn(`⚠️  Cloudinary: No se pudo subir ${tipo}:`, err.message);
          return null;
        }
      };

      const [docCredencialUrl, docTituloUrl, docCuilUrl] = await Promise.all([
        subirDoc(req.files?.doc_credencial?.[0], 'credencial'),
        subirDoc(req.files?.doc_titulo?.[0],     'titulo'),
        subirDoc(req.files?.doc_cuil?.[0],       'cuil'),
      ]);

      await client.query(
        `INSERT INTO perfiles_abogado (
           usuario_id, plan_id, suscripcion_activa, visible_en_grilla,
           estado_aprobacion,
           dni_cuit, cuil, titulo_universitario, universidad, anio_graduacion,
           nro_credencial_letrado,
           doc_credencial_url, doc_titulo_url, doc_cuil_url
         ) VALUES ($1,$2,true,false,'pendiente',$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          usuario.id, planId,
          dni_cuit?.trim() || null,
          cuil?.trim() || null,
          titulo_universitario?.trim() || null,
          universidad?.trim() || null,
          anio_graduacion ? parseInt(anio_graduacion) : null,
          nro_credencial_letrado?.trim() || null,
          docCredencialUrl, docTituloUrl, docCuilUrl,
        ]
      );

      notificarAdminNuevoAbogado({
        abogadoNombre:   nombre,
        abogadoApellido: apellido,
        abogadoEmail:    email,
      }).catch(err => console.warn('⚠️  No se pudo notificar al admin:', err.message));

      // Notificación real-time al admin
      notifService.nuevoAbogadoRegistrado({
        abogadoNombre: `${nombre} ${apellido}`,
        abogadoEmail: email,
      }).catch(() => {});
    }

    await client.query('COMMIT');

    // Email de bienvenida + verificación (todos los roles)
    emailService.enviarBienvenida({ nombre, email, rol, tokenVerificacion });

    // Email adicional para abogados: aviso de que el perfil está en revisión
    if (rol === 'abogado') {
      emailService.notificarAbogadoPendiente({ nombre, email }).catch(() => {});
    }

    const mensajeRespuesta = rol === 'abogado'
      ? '¡Registro exitoso! Revisá tu email para verificar tu cuenta. Tu perfil será revisado por nuestro equipo.'
      : '¡Registro exitoso! Revisá tu email para verificar tu cuenta.';

    res.status(201).json({
      mensaje: mensajeRespuesta,
      rol,
      pendiente_aprobacion: rol === 'abogado',
      usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// Función interna: notificar al admin sobre nuevo abogado
// Busca todos los admins registrados y les crea una notificación
// ─────────────────────────────────────────────────────────────
const notificarAdminNuevoAbogado = async ({ abogadoNombre, abogadoApellido, abogadoEmail }) => {
  try {
    // Obtener todos los administradores
    const { rows: admins } = await query(
      `SELECT u.id, u.email, u.nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE r.nombre = 'admin' AND u.activo = true`
    );

    for (const admin of admins) {
      // Crear notificación en la app para cada admin
      await query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
         VALUES ($1, 'nuevo_abogado', 'Nuevo abogado pendiente de aprobación',
                 $2, '/admin/abogados')`,
        [
          admin.id,
          `${abogadoNombre} ${abogadoApellido} (${abogadoEmail}) se registró y espera aprobación.`,
        ]
      );

      // Enviar email al admin (sin bloquear)
      emailService.notificarAdminNuevoAbogado({
        adminNombre:     admin.nombre,
        adminEmail:      admin.email,
        abogadoNombre,
        abogadoApellido,
        abogadoEmail,
      });
    }
  } catch (err) {
    // No frenar el flujo si falla la notificación
    console.error('Error al notificar al admin:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Autentica un usuario y devuelve un JWT
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.nombre, u.apellido,
              u.activo, u.email_verificado, u.avatar_url,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    // Mensaje genérico para no revelar si el email existe
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Tu cuenta ha sido deshabilitada. Contactá al soporte.'
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    // ── SEGURIDAD: Bloquear acceso si el email no fue verificado ──
    if (!usuario.email_verificado) {
      return res.status(403).json({
        error: 'Debés verificar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.',
        codigo: 'EMAIL_NO_VERIFICADO',
      });
    }

    const advertencias = [];

    // Actualizar fecha de último login
    await query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [usuario.id]);

    const token = generarToken(usuario);

    // Si es abogado, incluir datos del perfil y estado de aprobación
    let perfilAbogado = null;
    if (usuario.rol === 'abogado') {
      const { rows: perfil } = await query(
        `SELECT pa.plan_id, pa.suscripcion_activa, pa.perfil_completo,
                pa.visible_en_grilla, pa.credencial_activa,
                pa.estado_aprobacion, pa.motivo_rechazo,
                ps.nombre AS plan_nombre, ps.slug AS plan_slug
         FROM perfiles_abogado pa
         JOIN planes_suscripcion ps ON pa.plan_id = ps.id
         WHERE pa.usuario_id = $1`,
        [usuario.id]
      );
      perfilAbogado = perfil[0] || null;

      // Agregar advertencia si el perfil está pendiente de aprobación
      if (perfilAbogado?.estado_aprobacion === 'pendiente') {
        advertencias.push('Tu perfil está pendiente de aprobación por nuestro equipo.');
      }
      if (perfilAbogado?.estado_aprobacion === 'rechazado') {
        advertencias.push(`Tu perfil fue rechazado. Motivo: ${perfilAbogado.motivo_rechazo || 'Contactá al soporte.'}`);
      }
    }

    res.json({
      token,
      usuario: {
        id:               usuario.id,
        nombre:           usuario.nombre,
        apellido:         usuario.apellido,
        email:            usuario.email,
        rol:              usuario.rol,
        avatar_url:       usuario.avatar_url,
        email_verificado: usuario.email_verificado,
        perfil_abogado:   perfilAbogado,
      },
      advertencias,
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/verificar-email?token=xxx
// ─────────────────────────────────────────────────────────────
const verificarEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificación no proporcionado.' });
    }

    const { rows, rowCount } = await query(
      `UPDATE usuarios
       SET email_verificado = true, token_verificacion = NULL
       WHERE token_verificacion = $1
         AND email_verificado  = false
         AND creado_en         > NOW() - INTERVAL '24 hours'
       RETURNING nombre, email`,
      [token]
    );

    if (rowCount === 0) {
      // Verificar si el token existe pero expiró
      const { rows: tokenExpirado } = await query(
        `SELECT id FROM usuarios
         WHERE token_verificacion = $1 AND email_verificado = false`,
        [token]
      );
      if (tokenExpirado.length > 0) {
        return res.status(400).json({
          error: 'El enlace de verificación expiró (24 horas). Solicitá uno nuevo.',
          codigo: 'TOKEN_EXPIRADO',
        });
      }
      return res.status(400).json({
        error: 'Enlace inválido o email ya verificado.',
        codigo: 'TOKEN_INVALIDO',
      });
    }

    res.json({
      mensaje: `¡Email verificado correctamente! Ya podés iniciar sesión, ${rows[0].nombre}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/solicitar-reset-password
// ─────────────────────────────────────────────────────────────
const solicitarResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await query(
      'SELECT id, nombre, email FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    // Respuesta genérica por seguridad
    if (rows.length === 0) {
      return res.json({ mensaje: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.' });
    }

    const usuario  = rows[0];
    const token    = uuidv4();
    const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      'UPDATE usuarios SET token_reset_pass = $1, token_reset_expira = $2 WHERE id = $3',
      [token, expiracion, usuario.id]
    );

    await emailService.enviarResetPassword({ nombre: usuario.nombre, email: usuario.email, token });

    res.json({ mensaje: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
    }

    const { rows } = await query(
      `SELECT id FROM usuarios
       WHERE token_reset_pass = $1 AND token_reset_expira > NOW() AND activo = true`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado. Solicitá un nuevo enlace.' });
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    await query(
      `UPDATE usuarios
       SET password_hash = $1, token_reset_pass = NULL, token_reset_expira = NULL
       WHERE id = $2`,
      [passwordHash, rows[0].id]
    );

    res.json({ mensaje: 'Contraseña restablecida exitosamente. Ya podés iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me — Datos del usuario autenticado
// ─────────────────────────────────────────────────────────────
const obtenerPerfil = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono,
              u.avatar_url, u.email_verificado, u.creado_en,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = rows[0];

    if (usuario.rol === 'abogado') {
      const { rows: perfil } = await query(
        `SELECT pa.*, ps.nombre AS plan_nombre, ps.slug AS plan_slug,
                ps.acceso_campus, ps.acceso_campus_completo, ps.gestion_turnos,
                ps.credencial_virtual, ps.networking, ps.beneficios_exclusivos,
                ps.difusion_profesional, ps.max_consultas_mes
         FROM perfiles_abogado pa
         JOIN planes_suscripcion ps ON pa.plan_id = ps.id
         WHERE pa.usuario_id = $1`,
        [usuario.id]
      );
      usuario.perfil_abogado = perfil[0] || null;
    }

    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reenviar-verificacion
// Reenvía el email de verificación si el token expiró
// ─────────────────────────────────────────────────────────────
const reenviarVerificacion = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'El email es obligatorio.' });

    const { rows } = await query(
      `SELECT id, nombre, email, email_verificado
       FROM usuarios WHERE email = $1 AND activo = true`,
      [email.toLowerCase().trim()]
    );

    // Respuesta genérica para no revelar si el email existe o no
    if (rows.length === 0 || rows[0].email_verificado) {
      return res.json({ mensaje: 'Si el email está registrado y sin verificar, recibirás un nuevo enlace.' });
    }

    const usuario = rows[0];

    // Generar nuevo token y actualizar
    const nuevoToken = uuidv4();
    await query(
      `UPDATE usuarios SET token_verificacion = $1, creado_en = NOW() WHERE id = $2`,
      [nuevoToken, usuario.id]
    );

    // Enviar email
    emailService.enviarBienvenida({
      nombre:            usuario.nombre,
      email:             usuario.email,
      rol:               'cliente',
      tokenVerificacion: nuevoToken,
    });

    res.json({ mensaje: 'Si el email está registrado y sin verificar, recibirás un nuevo enlace.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registro,
  login,
  verificarEmail,
  reenviarVerificacion,
  solicitarResetPassword,
  resetPassword,
  obtenerPerfil,
};
