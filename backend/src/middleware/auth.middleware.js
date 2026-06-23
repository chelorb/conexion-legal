// ============================================================
// src/middleware/auth.middleware.js
// Verifica que el usuario esté autenticado y tiene permisos
// Se usa como middleware en las rutas protegidas
//
// SEGURIDAD — Validación de sesión única:
//   Además de verificar la firma del JWT, compara el session_token
//   del JWT con el guardado en la DB. Si no coinciden, significa
//   que el usuario inició sesión desde otro lugar y esta sesión
//   quedó inválida. Se devuelve 401 con código SESSION_INVALIDADA.
// ============================================================

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verifica que el request tenga un JWT válido en el header Authorization
 * y que el session_token del JWT coincida con el de la DB (sesión única).
 * Si es válido, agrega el usuario al objeto req para usarlo en los controllers.
 * Uso: router.get('/ruta', verificarToken, controller)
 */
const verificarToken = async (req, res, next) => {
  try {
    // El token viene en el header: "Authorization: Bearer eyJhbGc..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Acceso denegado. Se requiere autenticación.'
      });
    }

    // Extraer el token (todo lo que viene después de "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verificar y decodificar el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la DB para confirmar que sigue activo
    // e incluir el session_token actual para comparar
    const { rows } = await query(
      `SELECT u.id, u.email, u.nombre, u.apellido, u.activo,
              u.session_token,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = rows[0];

    // Verificar que la cuenta no esté deshabilitada
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Tu cuenta está deshabilitada. Contactá al soporte.'
      });
    }

    // ── Validación de sesión única ────────────────────────────
    // El session_token del JWT debe coincidir con el de la DB.
    // Si alguien inició sesión desde otro lugar, el session_token
    // de la DB cambió y este token ya no es válido.
    if (usuario.session_token && decoded.session_token !== usuario.session_token) {
      return res.status(401).json({
        error: 'Tu sesión fue iniciada en otro dispositivo. Iniciá sesión nuevamente.',
        codigo: 'SESSION_INVALIDADA',
      });
    }

    // Adjuntar el usuario al request para usarlo en los controllers
    req.usuario = usuario;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Iniciá sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

/**
 * Fábrica de middleware para verificar roles específicos
 * Uso: router.get('/admin', verificarToken, requireRol('admin'), controller)
 * O múltiples roles: requireRol('admin', 'abogado')
 */
const requireRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso restringido. Se requiere rol: ${rolesPermitidos.join(' o ')}.`
      });
    }

    next();
  };
};

/**
 * Verifica que el abogado tenga un plan activo con cierta funcionalidad
 * Uso: requirePlanFeature('acceso_campus')
 */
const requirePlanFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT ps.${feature}
         FROM perfiles_abogado pa
         JOIN planes_suscripcion ps ON pa.plan_id = ps.id
         WHERE pa.usuario_id = $1 AND pa.suscripcion_activa = true`,
        [req.usuario.id]
      );

      if (rows.length === 0 || !rows[0][feature]) {
        return res.status(403).json({
          error: 'Tu plan actual no incluye esta funcionalidad. Considerá actualizar tu suscripción.',
          upgrade_required: true
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { verificarToken, requireRol, requirePlanFeature };
