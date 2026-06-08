// ============================================================
// src/services/cloudinary.service.js
// Centraliza la subida de archivos a Cloudinary
// ============================================================

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Sube un archivo buffer a Cloudinary
 * @param {Buffer} buffer - El buffer del archivo
 * @param {Object} opciones - folder, filename, resource_type
 * @returns {Promise<{url, public_id}>}
 */
const subirArchivo = (buffer, opciones = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder        = 'conexion-legal/documentos',
      public_id,
      resource_type = 'auto', // auto detecta imagen o PDF
    } = opciones;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type,
        // URLs firmadas — acceso controlado
        type: 'authenticated',
        // Transformaciones básicas para imágenes
        transformation: resource_type === 'image'
          ? [{ quality: 'auto', fetch_format: 'auto' }]
          : undefined,
      },
      (error, resultado) => {
        if (error) return reject(error);
        resolve({
          url:       resultado.secure_url,
          public_id: resultado.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Eliminar un archivo de Cloudinary
 * @param {string} public_id
 * @param {string} resource_type - 'image' | 'raw' (PDF)
 */
const eliminarArchivo = async (public_id, resource_type = 'image') => {
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type, type: 'authenticated' });
  } catch (err) {
    console.warn('⚠️  Cloudinary: No se pudo eliminar:', public_id, err.message);
  }
};

/**
 * Generar URL firmada con expiración (para acceso seguro)
 * @param {string} public_id
 * @param {number} expiresInSeconds - default 1 hora
 */
const urlFirmada = (public_id, expiresInSeconds = 3600) => {
  return cloudinary.utils.private_download_url(public_id, 'jpg', {
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
};

module.exports = { subirArchivo, eliminarArchivo, urlFirmada };
