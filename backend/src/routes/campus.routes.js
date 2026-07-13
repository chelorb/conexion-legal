// ============================================================
// src/routes/campus.routes.js
// ============================================================
const expressK = require('express');
const routerK  = expressK.Router();
const { query: kQuery } = require('../config/database');
const { verificarToken, requireRol, requirePlanFeature } = require('../middleware/auth.middleware');

// GET /api/campus — Lista de contenido según plan del abogado
// Usa planes_requeridos (array) para determinar qué contenido puede ver cada abogado
// El abogado ve todo el contenido que incluya su slug de plan en planes_requeridos
routerK.get('/', verificarToken, requireRol('abogado'), requirePlanFeature('acceso_campus'), async (req, res, next) => {
  try {
    const { tipo, pagina = 1, limite = 12 } = req.query;

    // Obtener el slug del plan actual del abogado
    const { rows: perfil } = await kQuery(
      `SELECT ps.slug AS plan_slug
       FROM perfiles_abogado pa
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE pa.usuario_id = $1`,
      [req.usuario.id]
    );

    const planSlug = perfil[0]?.plan_slug || 'gratuito';

    // Filtrar contenido donde el slug del plan del abogado esté en planes_requeridos
    // Esto funciona con cualquier plan presente o futuro
    const condiciones = [
      'activo = true',
      '$1 = ANY(planes_requeridos)', // el abogado puede ver este contenido
    ];
    const params = [planSlug];
    let idx = 2;

    if (tipo) {
      condiciones.push(`tipo = $${idx++}`);
      params.push(tipo);
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    params.push(parseInt(limite), offset);

    // También traer TODO el contenido bloqueado para mostrar el candado
    // (el abogado ve qué existe pero no puede acceder)
    const { rows: todo } = await kQuery(
      `SELECT id, tipo, titulo, descripcion, miniatura_url, duracion_min,
              autor, especialidad, planes_requeridos, es_evento, fecha_evento, creado_en,
              ($1 = ANY(planes_requeridos)) AS tiene_acceso
       FROM contenido_campus
       WHERE activo = true
       ${tipo ? `AND tipo = $${idx - 1}` : ''}
       ORDER BY es_evento DESC, creado_en DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ contenido: todo, plan_slug: planSlug });

  } catch (error) {
    next(error);
  }
});

// GET /api/campus/planes — Devuelve los slugs de planes activos para el selector del admin
routerK.get('/planes', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { rows } = await kQuery(
      'SELECT id, nombre, slug FROM planes_suscripcion WHERE activo = true ORDER BY precio_mensual ASC'
    );
    res.json({ planes: rows });
  } catch (error) { next(error); }
});

module.exports = routerK;
