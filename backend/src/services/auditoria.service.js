// ============================================================
// src/services/auditoria.service.js
// Registra acciones críticas del admin en la tabla auditoria_admin
//
// Uso desde cualquier route:
//   const auditar = require('../services/auditoria.service');
//   await auditar(req, { accion, descripcion, entidad, entidad_id,
//                        entidad_label, datos_antes, datos_despues });
// ============================================================

const { query } = require('../config/database');

/**
 * Registra una acción de auditoría en la DB.
 * Nunca lanza errores — si falla, solo loguea en consola.
 *
 * @param {object} req         - Request de Express (para obtener admin y IP)
 * @param {object} opciones
 *   @param {string} accion         - Identificador de la acción ('aprobar_abogado', 'cambiar_plan', etc.)
 *   @param {string} descripcion    - Texto legible para humanos ('Aprobó el perfil de Juan Pérez')
 *   @param {string} entidad        - Tipo de entidad afectada ('usuario', 'plan', 'config')
 *   @param {string} entidad_id     - ID del objeto afectado
 *   @param {string} entidad_label  - Nombre/email legible del objeto ('Juan Pérez <juan@email.com>')
 *   @param {object} datos_antes    - Snapshot del estado anterior (opcional)
 *   @param {object} datos_despues  - Snapshot del estado posterior (opcional)
 */
const auditar = async (req, {
  accion,
  descripcion   = null,
  entidad       = null,
  entidad_id    = null,
  entidad_label = null,
  datos_antes   = null,
  datos_despues = null,
}) => {
  try {
    // Obtener la IP real del cliente (considera proxies de Render/Vercel)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.socket?.remoteAddress
            || null;

    await query(
      `INSERT INTO auditoria_admin
         (admin_id, admin_email, accion, descripcion,
          entidad, entidad_id, entidad_label,
          datos_antes, datos_despues, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.usuario?.id    || null,
        req.usuario?.email || null,
        accion,
        descripcion,
        entidad,
        entidad_id    ? String(entidad_id) : null,
        entidad_label || null,
        datos_antes   ? JSON.stringify(datos_antes)   : null,
        datos_despues ? JSON.stringify(datos_despues) : null,
        ip,
      ]
    );
  } catch (err) {
    // La auditoría nunca debe cortar el flujo principal
    console.error('⚠️  Error al registrar auditoría:', err.message);
  }
};

module.exports = auditar;
