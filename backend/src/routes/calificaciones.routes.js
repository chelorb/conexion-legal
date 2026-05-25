// ============================================================
// src/routes/calificaciones.routes.js
// ============================================================
const expressC = require('express');
const routerC  = expressC.Router();
const { query: dbQuery } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const { validarCalificacion } = require('../middleware/validacion.middleware');

// POST /api/calificaciones/:consulta_id — El cliente califica al abogado
routerC.post('/:consulta_id', verificarToken, requireRol('cliente'), validarCalificacion, async (req, res, next) => {
  try {
    const { consulta_id } = req.params;
    const { puntaje, comentario } = req.body;
    const clienteId = req.usuario.id;

    // Verificar que la consulta existe, está completada y pertenece al cliente
    const { rows: consulta } = await dbQuery(
      `SELECT c.abogado_id FROM consultas c
       WHERE c.id = $1 AND c.cliente_id = $2 AND c.estado = 'completada'`,
      [consulta_id, clienteId]
    );

    if (consulta.length === 0) {
      return res.status(404).json({
        error: 'Consulta no encontrada o no completada. Solo podés calificar consultas finalizadas.'
      });
    }

    const abogadoId = consulta[0].abogado_id;

    // Insertar la calificación (UNIQUE en consulta_id previene duplicados)
    await dbQuery(
      `INSERT INTO calificaciones (consulta_id, cliente_id, abogado_id, puntaje, comentario)
       VALUES ($1, $2, $3, $4, $5)`,
      [consulta_id, clienteId, abogadoId, puntaje, comentario]
    );

    // Recalcular el promedio del abogado
    await dbQuery(
      `UPDATE perfiles_abogado SET
         calificacion_promedio = (
           SELECT ROUND(AVG(puntaje)::numeric, 2) FROM calificaciones WHERE abogado_id = $1
         ),
         total_calificaciones = (
           SELECT COUNT(*) FROM calificaciones WHERE abogado_id = $1
         )
       WHERE usuario_id = $1`,
      [abogadoId]
    );

    res.status(201).json({ mensaje: '¡Gracias por tu calificación!' });

  } catch (error) {
    if (error.code === '23505') { // Violación de UNIQUE
      return res.status(409).json({ error: 'Ya calificaste esta consulta.' });
    }
    next(error);
  }
});

module.exports = routerC;



// GET /api/calificaciones/abogado/:id — Calificaciones públicas de un abogado
routerC.get('/abogado/:id', async (req, res, next) => {
  try {
    const { rows } = await dbQuery(
      `SELECT c.puntaje AS calificacion, c.comentario, c.creado_en,
              u.nombre AS cliente_nombre
       FROM calificaciones c
       JOIN usuarios u ON c.cliente_id = u.id
       WHERE c.abogado_id = $1
       ORDER BY c.creado_en DESC
       LIMIT 20`,
      [req.params.id]
    );
    res.json({ calificaciones: rows });
  } catch (error) { next(error); }
});
