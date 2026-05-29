// ============================================================
// src/services/email.service.js
// Centraliza el envío de todos los emails de la plataforma
// Usa Nodemailer con Gmail SMTP (se puede cambiar a SendGrid, etc.)
// ============================================================

const nodemailer = require('nodemailer');

// Crear el transportador SMTP una sola vez (se reutiliza)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para puerto 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Usar "Contraseña de aplicación" en Gmail
  },
});

// Verificar conexión SMTP al iniciar (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️  Email: No se pudo conectar al servidor SMTP:', error.message);
    } else {
      console.log('✅ Email: Servidor SMTP conectado correctamente');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE BASE — HTML de todos los emails
// ─────────────────────────────────────────────────────────────

const templateBase = (titulo, contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a2e5a 0%, #2d4a8a 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 40px; color: #374151; }
    .content h2 { color: #1a2e5a; font-size: 20px; margin-bottom: 16px; }
    .content p { line-height: 1.7; margin-bottom: 16px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1a2e5a, #2d4a8a); color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .info-box { background: #f0f4ff; border-left: 4px solid #2d4a8a; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 13px; margin: 0; }
    .logo { font-size: 18px; font-weight: 700; color: white; }
    .logo span { color: #93c5fd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Conexión<span>Legal</span></div>
      <p>Plataforma de Asesoría Legal Digital</p>
    </div>
    <div class="content">
      ${contenido}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Conexión Legal — Todos los derechos reservados</p>
      <p style="margin-top: 8px;">Si no solicitaste este email, podés ignorarlo.</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// FUNCIONES DE ENVÍO
// ─────────────────────────────────────────────────────────────

/**
 * Envío genérico (base de todas las funciones de abajo)
 */
const enviarEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Conexión Legal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email enviado a ${to}: ${info.messageId}`);
    return { ok: true };
  } catch (error) {
    // Loguear el error pero no frenar el flujo principal de la app
    console.error(`❌ Error al enviar email a ${to}:`, error.message);
    return { ok: false, error: error.message };
  }
};

/**
 * Email de bienvenida después del registro
 */
const enviarBienvenida = async ({ nombre, email, rol, tokenVerificacion }) => {
  const urlVerificacion = `${process.env.FRONTEND_URL}/verificar-email?token=${tokenVerificacion}`;

  const contenido = `
    <h2>¡Bienvenido/a a Conexión Legal, ${nombre}!</h2>
    <p>Tu cuenta fue creada exitosamente como <strong>${rol === 'abogado' ? 'Profesional del Derecho' : 'Cliente'}</strong>.</p>
    <p>Para activar tu cuenta y comenzar a usar la plataforma, confirmá tu dirección de email:</p>
    <div style="text-align: center;">
      <a href="${urlVerificacion}" class="btn">Verificar mi Email</a>
    </div>
    <div class="info-box">
      <strong>⏱️ Este enlace expira en 24 horas.</strong><br>
      Si no podés hacer click en el botón, copiá este enlace: <br>
      <small>${urlVerificacion}</small>
    </div>
    <p>Si tenés alguna pregunta, no dudes en contactarnos.</p>
  `;

  return enviarEmail({
    to: email,
    subject: '✅ Verificá tu cuenta en Conexión Legal',
    html: templateBase('Verificación de cuenta', contenido),
  });
};

/**
 * Email de confirmación de turno para el cliente
 */
const enviarConfirmacionTurno = async ({ clienteNombre, clienteEmail, abogadoNombre, fecha, tipo, linkReunion }) => {
  const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const contenido = `
    <h2>Tu consulta fue confirmada ✅</h2>
    <p>Hola <strong>${clienteNombre}</strong>, tu consulta legal ha sido confirmada.</p>
    <div class="info-box">
      <strong>📅 Fecha y hora:</strong> ${fechaFormateada}<br>
      <strong>👨‍💼 Abogado/a:</strong> Dr./Dra. ${abogadoNombre}<br>
      <strong>📍 Modalidad:</strong> ${tipo === 'online' ? 'Online (videoconferencia)' : 'Presencial'}
      ${linkReunion ? `<br><strong>🔗 Enlace:</strong> <a href="${linkReunion}">${linkReunion}</a>` : ''}
    </div>
    <p>Te recomendamos tener a mano cualquier documentación relevante para tu caso.</p>
    <p>Si necesitás cancelar o reprogramar, hacelo con al menos 24 horas de anticipación.</p>
  `;

  return enviarEmail({
    to: clienteEmail,
    subject: '📅 Consulta confirmada — Conexión Legal',
    html: templateBase('Consulta confirmada', contenido),
  });
};

/**
 * Notificación al abogado de nueva consulta solicitada
 */
const notificarNuevaConsulta = async ({ abogadoEmail, abogadoNombre, clienteNombre, fecha, especialidad }) => {
  const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const contenido = `
    <h2>Nueva solicitud de consulta 📋</h2>
    <p>Hola <strong>Dr./Dra. ${abogadoNombre}</strong>, tenés una nueva solicitud de consulta.</p>
    <div class="info-box">
      <strong>👤 Cliente:</strong> ${clienteNombre}<br>
      <strong>📅 Fecha solicitada:</strong> ${fechaFormateada}<br>
      ${especialidad ? `<strong>⚖️ Especialidad:</strong> ${especialidad}` : ''}
    </div>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/abogado/consultas" class="btn">Ver y Confirmar Consulta</a>
    </div>
    <p>Tenés 24 horas para confirmar o rechazar la solicitud.</p>
  `;

  return enviarEmail({
    to: abogadoEmail,
    subject: '🔔 Nueva solicitud de consulta — Conexión Legal',
    html: templateBase('Nueva consulta', contenido),
  });
};

/**
 * Email de recuperación de contraseña
 */
const enviarResetPassword = async ({ nombre, email, token }) => {
  const urlReset = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const contenido = `
    <h2>Restablecé tu contraseña</h2>
    <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <div style="text-align: center;">
      <a href="${urlReset}" class="btn">Restablecer Contraseña</a>
    </div>
    <div class="info-box">
      <strong>⏱️ Este enlace expira en 1 hora.</strong><br>
      Si no solicitaste el cambio de contraseña, ignorá este email. Tu contraseña actual seguirá siendo válida.
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '🔒 Restablecé tu contraseña — Conexión Legal',
    html: templateBase('Restablecer contraseña', contenido),
  });
};

/**
 * Email de confirmación de suscripción
 */
const enviarConfirmacionSuscripcion = async ({ nombre, email, plan, fechaFin }) => {
  const fechaFormateada = new Date(fechaFin).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const contenido = `
    <h2>¡Tu suscripción está activa! 🎉</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, tu suscripción al plan <strong>${plan}</strong> fue procesada exitosamente.</p>
    <div class="info-box">
      <strong>📋 Plan:</strong> ${plan}<br>
      <strong>📅 Válido hasta:</strong> ${fechaFormateada}
    </div>
    <p>Ya podés acceder a todas las funcionalidades de tu plan desde tu panel de control.</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/abogado/dashboard" class="btn">Ir a mi Panel</a>
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '🎉 Suscripción activada — Conexión Legal',
    html: templateBase('Suscripción activada', contenido),
  });
};

module.exports = {
  enviarBienvenida,
  enviarConfirmacionTurno,
  notificarNuevaConsulta,
  enviarResetPassword,
  enviarConfirmacionSuscripcion,
};


// ─────────────────────────────────────────────────────────────
// Email al admin: nuevo abogado esperando aprobación
// ─────────────────────────────────────────────────────────────
const notificarAdminNuevoAbogado = async ({ adminNombre, adminEmail, abogadoNombre, abogadoApellido, abogadoEmail }) => {
  const contenido = `
    <h2>Nuevo abogado pendiente de aprobación 📋</h2>
    <p>Hola <strong>${adminNombre}</strong>, un nuevo profesional se registró y está esperando tu revisión.</p>
    <div class="info-box">
      <strong>👤 Nombre:</strong> ${abogadoNombre} ${abogadoApellido}<br>
      <strong>📧 Email:</strong> ${abogadoEmail}
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/admin/abogados" class="btn">
        Revisar perfil en el panel admin
      </a>
    </div>
  `;
  return enviarEmail({
    to:      adminEmail,
    subject: '🔔 Nuevo abogado pendiente de aprobación — Conexión Legal',
    html:    templateBase('Nuevo abogado pendiente', contenido),
  });
};

// ─────────────────────────────────────────────────────────────
// Email al abogado: perfil aprobado
// ─────────────────────────────────────────────────────────────
const notificarAbogadoAprobado = async ({ nombre, email }) => {
  const contenido = `
    <h2>¡Tu perfil fue aprobado! ✅</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, nuestro equipo revisó tu perfil y fue aprobado.</p>
    <p>A partir de ahora aparecés en la grilla de búsqueda de Conexión Legal y los clientes pueden contactarte.</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/abogado/dashboard" class="btn">
        Ir a mi panel
      </a>
    </div>
  `;
  return enviarEmail({
    to:      email,
    subject: '✅ ¡Tu perfil fue aprobado! — Conexión Legal',
    html:    templateBase('Perfil aprobado', contenido),
  });
};

// ─────────────────────────────────────────────────────────────
// Email al abogado: perfil rechazado con motivo
// ─────────────────────────────────────────────────────────────
const notificarAbogadoRechazado = async ({ nombre, email, motivo }) => {
  const contenido = `
    <h2>Tu perfil necesita correcciones</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, revisamos tu perfil y encontramos algunos puntos a mejorar antes de poder aprobarlo.</p>
    <div class="info-box">
      <strong>📋 Motivo:</strong><br>
      ${motivo || 'Por favor completá todos los campos requeridos y asegurate de que la matrícula sea válida.'}
    </div>
    <p>Podés actualizar tu perfil desde tu panel y volver a solicitar la revisión.</p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/abogado/perfil" class="btn">
        Actualizar mi perfil
      </a>
    </div>
  `;
  return enviarEmail({
    to:      email,
    subject: 'ℹ️ Tu perfil necesita correcciones — Conexión Legal',
    html:    templateBase('Perfil pendiente de correcciones', contenido),
  });
};

// Exportar las nuevas funciones junto con las existentes
module.exports = Object.assign(module.exports, {
  notificarAdminNuevoAbogado,
  notificarAbogadoAprobado,
  notificarAbogadoRechazado,
});
