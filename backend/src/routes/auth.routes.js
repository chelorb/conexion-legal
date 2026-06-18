// ============================================================
// src/routes/auth.routes.js — Rutas de autenticación
// Los documentos se suben a Cloudinary (SDK ya instalado)
// usando memoryStorage para no depender del disco de Render
// ============================================================

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const rateLimit = require('express-rate-limit');
const streamifier = require('streamifier');
const cloudinary  = require('cloudinary').v2;
const ctrl      = require('../controllers/auth.controller');
const { verificarToken }    = require('../middleware/auth.middleware');
const { validarRegistro, validarLogin } = require('../middleware/validacion.middleware');
const { verificarHCaptcha } = require('../middleware/hcaptcha.middleware');

// ─────────────────────────────────────────────────────────────
// Cloudinary — usa las variables ya configuradas en Render
// ─────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────
const limiterLogin = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiados intentos de inicio de sesión. Esperá 15 minutos antes de volver a intentarlo.' },
  skip: () => process.env.NODE_ENV === 'development',
});

const limiterRegistro = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiados registros desde esta IP. Esperá una hora antes de volver a intentarlo.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// ─────────────────────────────────────────────────────────────
// Multer con memoryStorage — archivos en RAM, no en disco
// Render no tiene filesystem persistente entre deploys
// ─────────────────────────────────────────────────────────────
const uploadMemoria = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Solo se aceptan archivos PDF, JPG, PNG o WebP.'));
    }
    cb(null, true);
  },
});

const camposDocumentos = uploadMemoria.fields([
  { name: 'doc_titulo',     maxCount: 1 },
  { name: 'doc_cuil',       maxCount: 1 },
  { name: 'doc_credencial', maxCount: 1 },
]);

// ─────────────────────────────────────────────────────────────
// Sube un buffer a Cloudinary usando el SDK con stream
// ─────────────────────────────────────────────────────────────
const subirACloudinary = (buffer, nombreCampo) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        'iustixium/documentos',
        resource_type: 'auto',  // detecta PDF o imagen automáticamente
        type:          'upload', // accesible via URL directa (no authenticated)
        public_id:     `${nombreCampo}_${Date.now()}`,
      },
      (error, resultado) => {
        if (error) {
          console.error(`[Cloudinary] Error subiendo ${nombreCampo}:`, error.message);
          return resolve(null); // No bloquear el registro si falla
        }
        resolve(resultado.secure_url);
      }
    );

    // Convertir el buffer a stream y pasárselo a Cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ─────────────────────────────────────────────────────────────
// Middleware: procesa los archivos en memoria y los sube a
// Cloudinary en paralelo antes de llegar al controlador
// ─────────────────────────────────────────────────────────────
const procesarDocumentos = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      req.documentosUrls = {};
      return next();
    }

    // Subir todos los documentos en paralelo
    const promesas = Object.entries(req.files).map(async ([campo, archivos]) => {
      const archivo = archivos[0];
      if (!archivo?.buffer) return [campo, null];
      const url = await subirACloudinary(archivo.buffer, campo);
      return [campo, url];
    });

    const resultados = await Promise.all(promesas);

    // Convertir array de pares a objeto { doc_titulo: url, ... }
    req.documentosUrls = Object.fromEntries(resultados);

    next();
  } catch (err) {
    console.error('[procesarDocumentos] Error inesperado:', err.message);
    req.documentosUrls = {};
    next(); // No bloquear el registro
  }
};

// ─────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────
router.post('/registro',
  limiterRegistro,
  camposDocumentos,       // 1. multer parsea el multipart y pone archivos en memoria
  procesarDocumentos,     // 2. sube a Cloudinary y pone URLs en req.documentosUrls
  verificarHCaptcha,      // 3. verifica el captcha
  validarRegistro,        // 4. valida campos del formulario
  ctrl.registro           // 5. crea el usuario en la BD
);

router.post('/login', limiterLogin, validarLogin, ctrl.login);

router.get('/verificar-email',           ctrl.verificarEmail);
router.post('/solicitar-reset-password', ctrl.solicitarResetPassword);
router.post('/reset-password',           ctrl.resetPassword);
router.get('/me', verificarToken,        ctrl.obtenerPerfil);

module.exports = router;
