// ============================================================
// src/middleware/validacion.middleware.js
// Centraliza la validación de datos de entrada en los requests
// Usa express-validator para definir las reglas de validación
// ============================================================

const { validationResult, body, param, query } = require('express-validator');

/**
 * Ejecuta las validaciones acumuladas y devuelve errores si los hay
 * Siempre se usa como ÚLTIMO middleware de la cadena de validaciones
 */
const validar = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      // Devolver todos los errores para que el frontend los muestre en los campos
      campos: errores.array().map(e => ({
        campo: e.path,
        mensaje: e.msg,
      }))
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// VALIDACIONES DE AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────

const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número'),

  body('rol')
    .optional()
    .isIn(['abogado', 'cliente']).withMessage('El rol debe ser "abogado" o "cliente"'),

  validar,
];

const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),

  validar,
];

// ─────────────────────────────────────────────────────────────
// VALIDACIONES DE PERFIL DE ABOGADO
// ─────────────────────────────────────────────────────────────

const validarPerfilAbogado = [
  body('matricula')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La matrícula no puede superar 100 caracteres'),

  body('especialidades')
    .optional()
    .isArray({ min: 1, max: 10 }).withMessage('Debe seleccionar entre 1 y 10 especialidades'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres'),

  body('anos_experiencia')
    .optional()
    .isInt({ min: 0, max: 70 }).withMessage('Los años de experiencia deben ser un número entre 0 y 70'),

  body('provincia')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('ciudad')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  validar,
];

// ─────────────────────────────────────────────────────────────
// VALIDACIONES DE CONSULTAS
// ─────────────────────────────────────────────────────────────

const validarConsulta = [
  body('abogado_id')
    .notEmpty().withMessage('Debe seleccionar un abogado')
    .isUUID().withMessage('ID de abogado inválido'),

  body('tipo')
    .isIn(['online', 'presencial']).withMessage('El tipo debe ser "online" o "presencial"'),

  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción del caso es obligatoria')
    .isLength({ min: 20, max: 2000 }).withMessage('La descripción debe tener entre 20 y 2000 caracteres'),

  body('fecha_hora')
    .notEmpty().withMessage('La fecha y hora son obligatorias')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value) => {
      // La consulta debe ser en el futuro
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha de la consulta debe ser en el futuro');
      }
      return true;
    }),

  body('especialidad')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  validar,
];

// ─────────────────────────────────────────────────────────────
// VALIDACIONES DE CALIFICACIONES
// ─────────────────────────────────────────────────────────────

const validarCalificacion = [
  body('puntaje')
    .notEmpty().withMessage('El puntaje es obligatorio')
    .isInt({ min: 1, max: 5 }).withMessage('El puntaje debe ser entre 1 y 5'),

  body('comentario')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('El comentario no puede superar 1000 caracteres'),

  validar,
];

module.exports = {
  validar,
  validarRegistro,
  validarLogin,
  validarPerfilAbogado,
  validarConsulta,
  validarCalificacion,
};
