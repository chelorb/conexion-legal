// ============================================================
// src/routes/campus.routes.js
// ============================================================
const expressK = require('express');
const routerK  = expressK.Router();
const { query: kQuery } = require('../config/database');
const { verificarToken, requireRol, requirePlanFeature } = require('../middleware/auth.middleware');

// GET /api/campus — Lista de contenido según plan del abogado
routerK.get('/', verificarToken, requireRol('abogado'), requirePlanFeature('acceso_campus'), async (req, res, next) => {
  try {
    const { tipo, pagina = 1, limite = 12 } = req.query;

    // Determinar qué planes puede ver según su suscripción
    const { rows: perfil } = await kQuery(
      `SELECT ps.acceso_campus_completo
       FROM perfiles_abogado pa
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE pa.usuario_id = $1`,
      [req.usuario.id]
    );

    const tieneAccesoCompleto = perfil[0]?.acceso_campus_completo;
    const planesVisibles = tieneAccesoCompleto ? ['gratuito', 'basico', 'premium'] : ['gratuito', 'basico'];

    const condiciones = ['activo = true', `plan_requerido = ANY($1)`];
    const params = [planesVisibles];
    let idx = 2;

    if (tipo) {
      condiciones.push(`tipo = $${idx++}`);
      params.push(tipo);
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    params.push(parseInt(limite), offset);

    const { rows } = await kQuery(
      `SELECT id, tipo, titulo, descripcion, miniatura_url, duracion_min,
              autor, especialidad, plan_requerido, es_evento, fecha_evento, creado_en
       FROM contenido_campus
       WHERE ${condiciones.join(' AND ')}
       ORDER BY es_evento DESC, creado_en DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ contenido: rows });

  } catch (error) {
    next(error);
  }
});

module.exports = routerK;


