// ============================================================
// src/routes/usuarios.routes.js
// ============================================================
const expressU = require('express');
const routerU  = expressU.Router();
const { query: uQuery } = require('../config/database');
const multer   = require('multer');
const path     = require('path');
const { verificarToken } = require('../middleware/auth.middleware');

// Configuración de Multer para fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.usuario.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tipos.includes(file.mimetype)) {
      return cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP'));
    }
    cb(null, true);
  }
});

// Subir/actualizar foto de perfil
routerU.post('/avatar', verificarToken, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

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


