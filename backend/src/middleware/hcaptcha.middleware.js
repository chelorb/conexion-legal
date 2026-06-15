// ============================================================
// src/middleware/hcaptcha.middleware.js
// Verifica el token de hCaptcha antes de procesar el registro
// Usa el módulo https nativo de Node.js — sin dependencias extra
// ============================================================

const https    = require('https');
const querystring = require('querystring');

const verificarHCaptcha = async (req, res, next) => {
  // En desarrollo local salteamos la verificación
  if (process.env.NODE_ENV === 'development') return next();

  const token = req.body['h-captcha-response'];

  if (!token) {
    return res.status(400).json({
      error: 'Por favor completá el captcha para continuar.',
    });
  }

  try {
    // Verificar el token con la API de hCaptcha usando https nativo
    const resultado = await new Promise((resolve, reject) => {
      const postData = querystring.stringify({
        secret:   process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      });

      const opciones = {
        hostname: 'hcaptcha.com',
        path:     '/siteverify',
        method:   'POST',
        headers: {
          'Content-Type':   'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const peticion = https.request(opciones, (respuesta) => {
        let datos = '';
        respuesta.on('data', chunk => { datos += chunk; });
        respuesta.on('end', () => {
          try { resolve(JSON.parse(datos)); }
          catch { reject(new Error('Respuesta inválida de hCaptcha')); }
        });
      });

      peticion.on('error', reject);
      peticion.write(postData);
      peticion.end();
    });

    if (!resultado.success) {
      console.warn('[hCaptcha] Verificación fallida:', resultado['error-codes']);
      return res.status(400).json({
        error: 'Verificación de captcha fallida. Por favor intentá de nuevo.',
      });
    }

    // Verificación exitosa — continuar con el registro
    next();
  } catch (err) {
    console.error('[hCaptcha] Error al verificar:', err.message);
    // Si el servicio falla, dejamos pasar para no bloquear usuarios legítimos
    next();
  }
};

module.exports = { verificarHCaptcha };
