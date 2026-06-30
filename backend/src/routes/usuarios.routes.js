// ============================================================
// src/routes/usuarios.routes.js
// Gestión de datos del usuario autenticado
// ============================================================

const expressU    = require('express');
const routerU     = expressU.Router();
const { query: uQuery } = require('../config/database');
const multer      = require('multer');
const streamifier = require('streamifier');
const cloudinary  = require('cloudinary').v2;
const { verificarToken } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────
// Cloudinary — usa las mismas variables configuradas en Render
// ─────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─────────────────────────────────────────────────────────────
// Multer con memoryStorage — archivos en RAM, no en disco.
// Render no tiene filesystem persistente entre deploys:
// cualquier archivo guardado en disco se pierde al redeployar.
// Cloudinary es el almacenamiento persistente correcto.
// ─────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tipos.includes(file.mimetype)) {
      return cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP.'));
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────────────────────
// Sube el buffer del avatar a Cloudinary y devuelve la URL segura
// ─────────────────────────────────────────────────────────────
const subirAvatarACloudinary = (buffer, usuarioId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        'iustixium/avatars',
        resource_type: 'image',
        public_id:     `avatar_${usuarioId}`,  // sobreescribe el anterior automáticamente
        overwrite:     true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // cuadrado centrado en la cara
          { quality: 'auto', fetch_format: 'auto' },                   // optimización automática
        ],
      },
      (error, resultado) => {
        if (error) {
          console.error('[Cloudinary] Error subiendo avatar:', error.message);
          return reject(error);
        }
        resolve(resultado.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ─────────────────────────────────────────────────────────────
// POST /api/usuarios/avatar
// Sube o actualiza la foto de perfil del usuario autenticado
// ─────────────────────────────────────────────────────────────
routerU.post('/avatar', verificarToken, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    // Subir a Cloudinary y obtener la URL persistente
    const avatarUrl = await subirAvatarACloudinary(req.file.buffer, req.usuario.id);

    // Guardar la URL de Cloudinary en la DB
    await uQuery(
      'UPDATE usuarios SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, req.usuario.id]
    );

    res.json({ mensaje: 'Foto de perfil actualizada.', avatar_url: avatarUrl });
  } catch (error) {
    next(error);
  }
});

module.exports = routerU;
