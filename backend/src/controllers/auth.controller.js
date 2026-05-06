// ============================================================
// src/controllers/auth.controller.js
// Maneja registro, login, verificación de email y reset de contraseña
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const emailService = require('../services/email.service');

/**
 * Genera un JWT firmado con los datos del usuario
 * @param {Object} usuario - Datos del usuario a incluir en el payload
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id:    usuario.id,
      email: usuario.email,
      rol:   usuario.rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/registro
// Registra un nuevo usuario (abogado o cliente)
// ─────────────────────────────────────────────────────────────
const registro = async (req, res, next) => {
  // Usamos una transacción porque creamos registros en múltiples tablas
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { nombre, apellido, email, password, rol = 'cliente', telefono } = req.body;

    // Verificar que el email no esté ya registrado
    const emailExistente = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El email ya está registrado en la plataforma.' });
    }

    // Obtener el ID del rol
    const rolResult = await client.query(
      'SELECT id FROM roles WHERE nombre = $1',
      [rol]
    );

    if (rolResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Rol inválido.' });
    }

    const rolId = rolResult.rows[0].id;

    // Hashear la contraseña (salt rounds: 12 = buen balance seguridad/velocidad)
    const passwordHash = await bcrypt.hash(password, 12);

    // Token para verificar el email (UUID aleatorio)
    const tokenVerificacion = uuidv4();

    // Crear el usuario
    const { rows: [usuario] } = await client.query(
      `INSERT INTO usuarios
         (nombre, apellido, email, password_hash, rol_id, telefono, token_verificacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, apellido, email`,
      [nombre, apellido, email, passwordHash, rolId, telefono || null, tokenVerificacion]
    );

    // Si es abogado, crear su perfil vacío con plan gratuito
    if (rol === 'abogado') {
      const planGratuito = await client.query(
        "SELECT id FROM planes_suscripcion WHERE slug = 'gratuito'"
      );
      const planId = planGratuito.rows[0]?.id || 1;

      await client.query(
        `INSERT INTO perfiles_abogado (usuario_id, plan_id, suscripcion_activa)
         VALUES ($1, $2, true)`,
        [usuario.id, planId]
      );
    }

    await client.query('COMMIT');

    // Enviar email de verificación (no bloqueamos si falla)
    emailService.enviarBienvenida({
      nombre,
      email,
      rol,
      tokenVerificacion,
    });

    res.status(201).json({
      mensaje: '¡Registro exitoso! Revisá tu email para verificar tu cuenta.',
      usuario: {
        id:       usuario.id,
        nombre:   usuario.nombre,
        apellido: usuario.apellido,
        email:    usuario.email,
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Autentica un usuario y devuelve un JWT
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario con su rol
    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.nombre, u.apellido,
              u.activo, u.email_verificado, u.avatar_url,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (rows.length === 0) {
      // Mensaje genérico para no revelar si el email existe
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const usuario = rows[0];

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Tu cuenta ha sido deshabilitada. Contactá al soporte.'
      });
    }

    // Comparar la contraseña con el hash guardado
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    // Advertir si el email no fue verificado, pero permitir el login
    const advertencias = [];
    if (!usuario.email_verificado) {
      advertencias.push('Tu email aún no fue verificado. Revisá tu bandeja de entrada.');
    }

    // Actualizar fecha de último login
    await query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
      [usuario.id]
    );

    // Generar el token JWT
    const token = generarToken(usuario);

    // Si es abogado, incluir datos de su suscripción
    let perfilAbogado = null;
    if (usuario.rol === 'abogado') {
      const { rows: perfil } = await query(
        `SELECT pa.plan_id, pa.suscripcion_activa, pa.perfil_completo,
                pa.visible_en_grilla, pa.credencial_activa,
                ps.nombre AS plan_nombre, ps.slug AS plan_slug
         FROM perfiles_abogado pa
         JOIN planes_suscripcion ps ON pa.plan_id = ps.id
         WHERE pa.usuario_id = $1`,
        [usuario.id]
      );
      perfilAbogado = perfil[0] || null;
    }

    res.json({
      token,
      usuario: {
        id:              usuario.id,
        nombre:          usuario.nombre,
        apellido:        usuario.apellido,
        email:           usuario.email,
        rol:             usuario.rol,
        avatar_url:      usuario.avatar_url,
        email_verificado: usuario.email_verificado,
        perfil_abogado:  perfilAbogado,
      },
      advertencias,
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/verificar-email?token=xxx
// Verifica el email del usuario con el token enviado
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
       WHERE token_verificacion = $1 AND email_verificado = false
       RETURNING nombre, email`,
      [token]
    );

    if (rowCount === 0) {
      return res.status(400).json({
        error: 'Token inválido o email ya verificado.'
      });
    }

    res.json({
      mensaje: `¡Email verificado exitosamente! Ya podés iniciar sesión, ${rows[0].nombre}.`
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/solicitar-reset-password
// Genera un token y envía email para restablecer contraseña
// ─────────────────────────────────────────────────────────────
const solicitarResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const { rows } = await query(
      'SELECT id, nombre, email FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    // Respuesta genérica para no revelar si el email existe (seguridad)
    if (rows.length === 0) {
      return res.json({
        mensaje: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'
      });
    }

    const usuario = rows[0];
    const token = uuidv4();
    const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      'UPDATE usuarios SET token_reset_pass = $1, token_reset_expira = $2 WHERE id = $3',
      [token, expiracion, usuario.id]
    );

    await emailService.enviarResetPassword({
      nombre: usuario.nombre,
      email:  usuario.email,
      token,
    });

    res.json({
      mensaje: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Restablece la contraseña con el token recibido por email
// ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // Verificar que el token existe y no expiró
    const { rows } = await query(
      `SELECT id FROM usuarios
       WHERE token_reset_pass = $1
         AND token_reset_expira > NOW()
         AND activo = true`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'Token inválido o expirado. Solicitá un nuevo enlace.'
      });
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    // Actualizar contraseña y limpiar el token (de un solo uso)
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
// GET /api/auth/me
// Devuelve los datos del usuario autenticado (desde el token)
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

    // Si es abogado, incluir su perfil completo
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

module.exports = {
  registro,
  login,
  verificarEmail,
  solicitarResetPassword,
  resetPassword,
  obtenerPerfil,
};
