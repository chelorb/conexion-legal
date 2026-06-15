// ============================================================
// src/middleware/hcaptcha.middleware.js
// Verifica el token de hCaptcha antes de procesar el registro
// Documentación: https://docs.hcaptcha.com/#verify-the-user-response-server-side
// ============================================================

const axios = require('axios');

const verificarHCaptcha = async (req, res, next) => {
  // En desarrollo local salteamos la verificación para no depender de internet
  if (process.env.NODE_ENV === 'development') return next();

  const token = req.body['h-captcha-response'];

  if (!token) {
    return res.status(400).json({
      error: 'Por favor completá el captcha para continuar.',
    });
  }

  try {
    // Verificar el token con la API de hCaptcha
    const { data } = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({
        secret:   process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!data.success) {
      console.warn('[hCaptcha] Verificación fallida:', data['error-codes']);
      return res.status(400).json({
        error: 'Verificación de captcha fallida. Por favor intentá de nuevo.',
      });
    }

    // Verificación exitosa — continuar con el registro
    next();
  } catch (err) {
    console.error('[hCaptcha] Error al verificar:', err.message);
    // Si el servicio de hCaptcha falla, dejamos pasar para no bloquear usuarios legítimos
    // En producción podés cambiar esto a un rechazo si preferís mayor seguridad
    next();
  }
};

module.exports = { verificarHCaptcha };
