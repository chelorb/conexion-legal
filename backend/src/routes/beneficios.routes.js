// ============================================================
// src/routes/beneficios.routes.js
// ============================================================
const expressB = require('express');
const routerB  = expressB.Router();
const { query: bQuery } = require('../config/database');
const { verificarToken, requireRol, requirePlanFeature } = require('../middleware/auth.middleware');

routerB.get('/', verificarToken, requireRol('abogado'), requirePlanFeature('beneficios_exclusivos'), async (req, res, next) => {
  try {
    const { rows } = await bQuery(
      `SELECT id, nombre, descripcion, categoria, descuento_pct,
              codigo_descuento, logo_url, link_externo
       FROM beneficios
       WHERE activo = true
       ORDER BY categoria, nombre`
    );
    res.json({ beneficios: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = routerB;


