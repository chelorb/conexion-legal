// ============================================================
// src/routes/consultas.routes.js
// Rutas de consultas y mensajes internos
// ============================================================

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/consultas.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const { validarConsulta } = require('../middleware/validacion.middleware');

// Crear consulta (cliente)
router.post('/',
  verificarToken, requireRol('cliente'), validarConsulta,
  ctrl.crearConsulta
);

// Listar consultas (abogado o cliente)
router.get('/',
  verificarToken, requireRol('abogado', 'cliente'),
  ctrl.listarConsultas
);

// Alias para el abogado (usado en el dashboard)
router.get('/mis-consultas',
  verificarToken, requireRol('abogado', 'cliente'),
  ctrl.listarConsultas
);

// Detalle de una consulta
router.get('/:id',
  verificarToken, requireRol('abogado', 'cliente', 'admin'),
  ctrl.obtenerConsulta
);

// Cambiar estado (confirmar, completar, cancelar)
router.patch('/:id/estado',
  verificarToken, requireRol('abogado', 'cliente', 'admin'),
  ctrl.actualizarEstadoConsulta
);

// Agregar link de videollamada
router.patch('/:id/link',
  verificarToken, requireRol('abogado'),
  async (req, res, next) => {
    try {
      const { link_videollamada } = req.body;
      const { query } = require('../config/database');
      await query(
        'UPDATE consultas SET link_reunion = $1 WHERE id = $2 AND abogado_id = $3',
        [link_videollamada, req.params.id, req.usuario.id]
      );
      res.json({ mensaje: 'Link actualizado.' });
    } catch (error) { next(error); }
  }
);

// Enviar mensaje en una consulta
router.post('/:id/mensajes',
  verificarToken, requireRol('abogado', 'cliente'),
  ctrl.enviarMensaje
);

module.exports = router;
