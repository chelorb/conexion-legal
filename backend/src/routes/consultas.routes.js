// ============================================================
// src/routes/consultas.routes.js
// Rutas de consultas y mensajes internos
// ============================================================

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/consultas.controller');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiting para envío de mensajes
// Máximo 30 mensajes por 5 minutos por IP — evita flood
const limiterMensajes = rateLimit({
  windowMs:        5 * 60 * 1000, // 5 minutos
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            () => process.env.NODE_ENV === 'development',
  message: { error: 'Demasiados mensajes en poco tiempo. Esperá unos minutos.' },
});

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
  limiterMensajes, verificarToken, requireRol('abogado', 'cliente'),
  ctrl.enviarMensaje
);

module.exports = router;
