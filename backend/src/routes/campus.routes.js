// ============================================================
// src/routes/campus.routes.js
// ============================================================
const expressK = require('express');
const routerK  = expressK.Router();
const { query: kQuery } = require('../config/database');
const { verificarToken, requireRol, requirePlanFeature } = require('../middleware/auth.middleware');

// GET /api/campus — Lista de contenido según plan del abogado
//
// Antes: filtraba por slugs hardcodeados ['gratuito', 'basico', 'premium']
// Ahora: usa las columnas reales del plan (acceso_campus_completo) para determinar
//        qué contenido puede ver, lo que funciona con cualquier plan presente o futuro
routerK.get('/', verificarToken, requireRol('abogado'), requirePlanFeature('acceso_campus'), async (req, res, next) => {
  try {
    const { tipo, pagina = 1, limite = 12 } = req.query;

    // Verificar si el abogado tiene acceso completo al campus
    // según la columna real de su plan en la DB — no por slug hardcodeado
    const { rows: perfil } = await kQuery(
      `SELECT ps.acceso_campus_completo
       FROM perfiles_abogado pa
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE pa.usuario_id = $1`,
      [req.usuario.id]
    );

    const tieneAccesoCompleto = perfil[0]?.acceso_campus_completo ?? false;

    // Si tiene acceso completo: ve todo el contenido activo
    // Si no: solo ve el contenido que NO requiere acceso completo
    // Esto funciona con cualquier plan nuevo que se cree en el futuro
    const condiciones = ['activo = true'];
    const params = [];
    let idx = 1;

    if (!tieneAccesoCompleto) {
      // Solo contenido que no requiera campus completo
      // El contenido "premium/comunidad" tiene plan_requerido distinto de 'gratuito'/'basico'
      // pero el criterio real es la columna acceso_campus_completo del plan
      condiciones.push(`plan_requerido != 'comunidad'`);
    }

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

    res.json({ contenido: rows, acceso_completo: tieneAccesoCompleto });

  } catch (error) {
    next(error);
  }
});

module.exports = routerK;
