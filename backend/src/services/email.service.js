// ============================================================
// src/services/email.service.js
// Centraliza el envío de todos los emails de la plataforma
// Paleta: Gris carbón #1C1B18 + Cobre #B86030
// ============================================================

// ── SendGrid HTTP API (sin SMTP — funciona en Render Free) ──
// Usamos fetch directo a la API de SendGrid en lugar de SMTP
// para evitar el bloqueo de puertos en Render

// ─────────────────────────────────────────────────────────────
// TEMPLATE BASE — Paleta C
// ─────────────────────────────────────────────────────────────
const templateBase = (titulo, contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F0EFED; padding: 40px 16px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(28,27,24,0.10); }
    .header { background: #1C1B18; padding: 32px 40px; text-align: center; }
    .logo { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .logo span { color: #B86030; }
    .header-sub { color: rgba(255,255,255,0.45); font-size: 13px; margin-top: 6px; }
    .content { padding: 40px; color: #3A3832; }
    .content h2 { color: #1C1B18; font-size: 20px; font-weight: 700; margin-bottom: 16px; }
    .content p { line-height: 1.7; margin-bottom: 16px; font-size: 15px; color: #56534A; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #B86030; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; }
    .info-box { background: #F7F6F4; border-left: 3px solid #B86030; padding: 16px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; line-height: 1.7; color: #3A3832; }
    .info-box strong { color: #1C1B18; }
    .alert-box { background: rgba(220,38,38,0.06); border-left: 3px solid #dc2626; padding: 16px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #7f1d1d; }
    .success-box { background: rgba(22,163,74,0.06); border-left: 3px solid #16a34a; padding: 16px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #14532d; }
    .divider { border: none; border-top: 1px solid #F0EFED; margin: 24px 0; }
    .footer { background: #F7F6F4; padding: 24px 40px; text-align: center; border-top: 1px solid #F0EFED; }
    .footer p { color: #8A8780; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IUSTIXIUM</div>
      <p class="header-sub">Plataforma Legal Digital</p>
    </div>
    <div class="content">
      ${contenido}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} IUSTIXIUM — Todos los derechos reservados</p>
      <p style="margin-top:6px;">Si no solicitaste este email, podés ignorarlo con tranquilidad.</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// FUNCIÓN BASE DE ENVÍO — SendGrid HTTP API
// ─────────────────────────────────────────────────────────────
const enviarEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY no configurada — email no enviado a:', to);
    return { ok: false, error: 'SendGrid no configurado' };
  }

  const from = process.env.EMAIL_FROM || 'adminiustixium@gmail.com';

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from:    { email: from, name: 'IUSTIXIUM' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (response.ok) {
      console.log(`📧 Email enviado → ${to} [${response.status}]`);
      return { ok: true };
    } else {
      const body = await response.text();
      console.error(`❌ SendGrid error → ${to}: ${response.status} ${body}`);
      return { ok: false, error: body };
    }
  } catch (error) {
    console.error(`❌ Error email → ${to}:`, error.message);
    return { ok: false, error: error.message };
  }
};

// ═════════════════════════════════════════════════════════════
// EMAILS DE REGISTRO Y VERIFICACIÓN
// ═════════════════════════════════════════════════════════════

/**
 * Bienvenida + verificación de email (clientes y abogados)
 */
const enviarBienvenida = async ({ nombre, email, rol, tokenVerificacion }) => {
  const urlVerificacion = `${process.env.FRONTEND_URL}/verificar-email?token=${tokenVerificacion}`;
  const esAbogado = rol === 'abogado';

  const contenido = `
    <h2>¡Bienvenido/a a IUSTIXIUM, ${nombre}!</h2>
    <p>Tu cuenta fue creada exitosamente como <strong>${esAbogado ? 'Profesional del Derecho' : 'Cliente'}</strong>.</p>
    <p>Para activar tu cuenta, confirmá tu dirección de email haciendo click en el botón:</p>
    <div class="btn-wrap">
      <a href="${urlVerificacion}" class="btn">Verificar mi email</a>
    </div>
    <div class="info-box">
      <strong>⏱ Este enlace expira en 24 horas.</strong><br>
      Si el botón no funciona, copiá este link en tu navegador:<br>
      <small style="color:#B86030;">${urlVerificacion}</small>
    </div>
    ${esAbogado ? `
    <hr class="divider">
    <p style="color:#8A8780;font-size:13px;">
      Recordá que tu perfil será revisado por nuestro equipo antes de aparecer en la plataforma.
      Te avisaremos por email cuando esté aprobado.
    </p>` : ''}
  `;

  return enviarEmail({
    to: email,
    subject: '✅ Verificá tu cuenta en IUSTIXIUM',
    html: templateBase('Verificá tu cuenta', contenido),
  });
};

/**
 * Aviso al abogado de que su perfil está pendiente de revisión
 */
const notificarAbogadoPendiente = async ({ nombre, email }) => {
  const contenido = `
    <h2>Tu registro fue recibido ⏳</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, recibimos tu solicitud de registro en IUSTIXIUM.</p>
    <p>Nuestro equipo está revisando tu perfil y documentación. Este proceso tarda entre <strong>24 y 48 horas hábiles</strong>.</p>
    <div class="info-box">
      <strong>¿Qué pasa ahora?</strong><br>
      1. Verificamos tu credencial y título universitario<br>
      2. Confirmamos tu matrícula profesional<br>
      3. Te enviamos un email cuando tu perfil esté aprobado
    </div>
    <p>Una vez aprobado, tu perfil aparecerá en el catálogo y los clientes podrán contactarte.</p>
    <p>Si tenés alguna consulta, respondé este email o escribinos a <strong>${process.env.EMAIL_FROM || 'adminiustixium@gmail.com'}</strong>.</p>
  `;

  return enviarEmail({
    to: email,
    subject: '⏳ Tu perfil está siendo revisado — IUSTIXIUM',
    html: templateBase('Perfil en revisión', contenido),
  });
};

// ═════════════════════════════════════════════════════════════
// EMAILS DE APROBACIÓN / RECHAZO (ADMIN → ABOGADO)
// ═════════════════════════════════════════════════════════════

/**
 * Perfil aprobado → abogado
 */
const notificarAbogadoAprobado = async ({ nombre, email }) => {
  const contenido = `
    <h2>¡Tu perfil fue aprobado! 🎉</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, nuestro equipo revisó tu perfil y documentación.</p>
    <div class="success-box">
      ✅ Tu perfil está activo y ya aparece en el catálogo de profesionales de IUSTIXIUM.
      Los clientes ya pueden encontrarte y solicitar consultas.
    </div>
    <p>Te recomendamos completar tu perfil con una foto, descripción profesional y tus horarios de disponibilidad para que los clientes tengan toda la información necesaria.</p>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/abogado/dashboard" class="btn">Ir a mi panel</a>
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '🎉 ¡Tu perfil fue aprobado! — IUSTIXIUM',
    html: templateBase('Perfil aprobado', contenido),
  });
};

/**
 * Perfil rechazado → abogado
 */
const notificarAbogadoRechazado = async ({ nombre, email, motivo }) => {
  const contenido = `
    <h2>Tu perfil no pudo ser aprobado</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, revisamos tu perfil y encontramos algunos puntos que necesitamos que corrijas.</p>
    <div class="alert-box">
      <strong>Motivo:</strong><br>
      ${motivo || 'Por favor revisá que todos los documentos estén completos y sean legibles, y que la matrícula sea válida.'}
    </div>
    <p>Podés corregir los datos y volver a solicitar la revisión desde tu perfil.</p>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/abogado/perfil" class="btn">Actualizar mi perfil</a>
    </div>
    <p style="font-size:13px;color:#8A8780;">Si creés que hay un error, respondé este email y lo revisamos.</p>
  `;

  return enviarEmail({
    to: email,
    subject: 'ℹ️ Tu perfil necesita correcciones — IUSTIXIUM',
    html: templateBase('Perfil pendiente de correcciones', contenido),
  });
};

// ═════════════════════════════════════════════════════════════
// EMAILS DE CONSULTAS
// ═════════════════════════════════════════════════════════════

/**
 * Nueva consulta solicitada → abogado
 */
const notificarNuevaConsulta = async ({ abogadoEmail, abogadoNombre, clienteNombre, fecha, especialidad }) => {
  const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const contenido = `
    <h2>Nueva solicitud de consulta 📋</h2>
    <p>Hola <strong>Dr./Dra. ${abogadoNombre}</strong>, tenés una nueva solicitud de consulta esperando tu confirmación.</p>
    <div class="info-box">
      <strong>👤 Cliente:</strong> ${clienteNombre}<br>
      <strong>📅 Fecha solicitada:</strong> ${fechaFormateada}<br>
      ${especialidad ? `<strong>⚖️ Especialidad:</strong> ${especialidad}` : ''}
    </div>
    <p>Tenés <strong>24 horas</strong> para confirmar o rechazar la solicitud.</p>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/abogado/consultas" class="btn">Ver y confirmar consulta</a>
    </div>
  `;

  return enviarEmail({
    to: abogadoEmail,
    subject: '🔔 Nueva solicitud de consulta — IUSTIXIUM',
    html: templateBase('Nueva consulta', contenido),
  });
};

/**
 * Consulta confirmada → cliente
 */
const enviarConfirmacionTurno = async ({ clienteNombre, clienteEmail, abogadoNombre, fecha, tipo, linkReunion }) => {
  const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const contenido = `
    <h2>Tu consulta fue confirmada ✅</h2>
    <p>Hola <strong>${clienteNombre}</strong>, tu consulta fue confirmada por el/la profesional.</p>
    <div class="info-box">
      <strong>📅 Fecha y hora:</strong> ${fechaFormateada}<br>
      <strong>👨‍💼 Abogado/a:</strong> Dr./Dra. ${abogadoNombre}<br>
      <strong>📍 Modalidad:</strong> ${tipo === 'online' ? 'Online (videollamada)' : 'Presencial'}
      ${linkReunion ? `<br><strong>🔗 Link de acceso:</strong> <a href="${linkReunion}" style="color:#B86030;">${linkReunion}</a>` : ''}
    </div>
    <p>Te recomendamos tener a mano cualquier documentación relevante para tu caso.</p>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/mis-consultas" class="btn">Ver mis consultas</a>
    </div>
  `;

  return enviarEmail({
    to: clienteEmail,
    subject: '📅 Consulta confirmada — IUSTIXIUM',
    html: templateBase('Consulta confirmada', contenido),
  });
};

// ═════════════════════════════════════════════════════════════
// EMAILS DE SEGURIDAD Y CUENTA
// ═════════════════════════════════════════════════════════════

/**
 * Reset de contraseña
 */
const enviarResetPassword = async ({ nombre, email, token }) => {
  const urlReset = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const contenido = `
    <h2>Restablecé tu contraseña 🔒</h2>
    <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <div class="btn-wrap">
      <a href="${urlReset}" class="btn">Restablecer contraseña</a>
    </div>
    <div class="info-box">
      <strong>⏱ Este enlace expira en 1 hora.</strong><br>
      Si no solicitaste este cambio, ignorá este email. Tu contraseña actual seguirá siendo válida.
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '🔒 Restablecé tu contraseña — IUSTIXIUM',
    html: templateBase('Restablecer contraseña', contenido),
  });
};

/**
 * Cuenta deshabilitada por el admin
 */
const notificarCuentaDeshabilitada = async ({ nombre, email }) => {
  const contenido = `
    <h2>Tu cuenta fue deshabilitada</h2>
    <p>Hola <strong>${nombre}</strong>, tu cuenta en IUSTIXIUM fue deshabilitada temporalmente por nuestro equipo de administración.</p>
    <div class="alert-box">
      No podrás acceder a la plataforma mientras tu cuenta esté deshabilitada.
    </div>
    <p>Si creés que esto es un error o querés más información, contactanos respondiendo este email.</p>
  `;

  return enviarEmail({
    to: email,
    subject: 'ℹ️ Tu cuenta fue deshabilitada — IUSTIXIUM',
    html: templateBase('Cuenta deshabilitada', contenido),
  });
};

/**
 * Cuenta rehabilitada por el admin
 */
const notificarCuentaRehabilitada = async ({ nombre, email }) => {
  const contenido = `
    <h2>Tu cuenta fue reactivada ✅</h2>
    <p>Hola <strong>${nombre}</strong>, tu cuenta en IUSTIXIUM fue reactivada y ya podés acceder normalmente.</p>
    <div class="success-box">
      ✅ Tu cuenta está activa. Podés iniciar sesión cuando quieras.
    </div>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/login" class="btn">Iniciar sesión</a>
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '✅ Tu cuenta fue reactivada — IUSTIXIUM',
    html: templateBase('Cuenta reactivada', contenido),
  });
};

// ═════════════════════════════════════════════════════════════
// EMAILS AL ADMIN
// ═════════════════════════════════════════════════════════════

/**
 * Nuevo abogado registrado → admins
 */
const notificarAdminNuevoAbogado = async ({ adminEmail, adminNombre, abogadoNombre, abogadoApellido, abogadoEmail }) => {
  const contenido = `
    <h2>Nuevo abogado pendiente de revisión 📋</h2>
    <p>Hola <strong>${adminNombre || 'Admin'}</strong>, un nuevo profesional se registró y está esperando tu revisión.</p>
    <div class="info-box">
      <strong>👤 Nombre:</strong> ${abogadoNombre} ${abogadoApellido || ''}<br>
      <strong>📧 Email:</strong> ${abogadoEmail}
    </div>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/admin/abogados" class="btn">Revisar en el panel admin</a>
    </div>
  `;

  return enviarEmail({
    to: adminEmail,
    subject: '🔔 Nuevo abogado pendiente de aprobación — IUSTIXIUM',
    html: templateBase('Nuevo abogado pendiente', contenido),
  });
};

/**
 * Comunicado manual del admin → usuarios
 */
const enviarComunicado = async ({ destinatarioEmail, destinatarioNombre, titulo, mensaje, link }) => {
  const contenido = `
    <h2>${titulo}</h2>
    <p>Hola <strong>${destinatarioNombre}</strong>,</p>
    <p>${mensaje}</p>
    ${link ? `
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}${link}" class="btn">Ver más información</a>
    </div>` : ''}
    <hr class="divider">
    <p style="font-size:13px;color:#8A8780;">Este es un comunicado oficial de IUSTIXIUM.</p>
  `;

  return enviarEmail({
    to: destinatarioEmail,
    subject: `📢 ${titulo} — IUSTIXIUM`,
    html: templateBase(titulo, contenido),
  });
};

/**
 * Confirmación de suscripción
 */
const enviarConfirmacionSuscripcion = async ({ nombre, email, plan, fechaFin }) => {
  const fechaFormateada = new Date(fechaFin).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const contenido = `
    <h2>¡Tu suscripción está activa! 🎉</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, tu suscripción al plan <strong>${plan}</strong> fue procesada exitosamente.</p>
    <div class="success-box">
      <strong>📋 Plan:</strong> ${plan}<br>
      <strong>📅 Válido hasta:</strong> ${fechaFormateada}
    </div>
    <div class="btn-wrap">
      <a href="${process.env.FRONTEND_URL}/abogado/dashboard" class="btn">Ir a mi panel</a>
    </div>
  `;

  return enviarEmail({
    to: email,
    subject: '🎉 Suscripción activada — IUSTIXIUM',
    html: templateBase('Suscripción activada', contenido),
  });
};


// ═════════════════════════════════════════════════════════════
// EMAIL DE CAMBIO DE PRECIOS EN PLANES
// ═════════════════════════════════════════════════════════════

/**
 * Notifica a un abogado que el precio de su plan fue actualizado
 * Se llama desde admin.routes.js al modificar un plan
 */
const notificarCambioPreciosPlan = async ({
  nombre, email, planNombre,
  precioMensualAnterior, precioMensualNuevo,
  precioAnualAnterior,   precioAnualNuevo,
}) => {
  // Formatear precios en pesos argentinos
  const fmt = (n) => n != null
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
    : null;

  // Construir filas de la tabla solo si el precio cambió
  const filaMensual = precioMensualAnterior !== precioMensualNuevo && precioMensualNuevo != null ? `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0EFED;color:#56534A;font-size:14px;">Mensual</td>
      <td style="padding:10px 0;border-bottom:1px solid #F0EFED;color:#8A8780;font-size:14px;text-decoration:line-through;">${fmt(precioMensualAnterior)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F0EFED;color:#1C1B18;font-size:14px;font-weight:600;">${fmt(precioMensualNuevo)}</td>
    </tr>` : '';

  const filaAnual = precioAnualAnterior !== precioAnualNuevo && precioAnualNuevo != null ? `
    <tr>
      <td style="padding:10px 0;color:#56534A;font-size:14px;">Anual</td>
      <td style="padding:10px 0;color:#8A8780;font-size:14px;text-decoration:line-through;">${fmt(precioAnualAnterior)}</td>
      <td style="padding:10px 0;color:#1C1B18;font-size:14px;font-weight:600;">${fmt(precioAnualNuevo)}</td>
    </tr>` : '';

  const contenido = `
    <h2>Actualizamos los valores de tu plan 📋</h2>
    <p>Hola <strong>Dr./Dra. ${nombre}</strong>, te informamos que actualizamos los precios del plan <strong>${planNombre}</strong>.</p>

    <div class="info-box" style="margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;font-size:12px;color:#8A8780;text-transform:uppercase;letter-spacing:0.05em;">Período</th>
            <th style="text-align:left;padding:8px 0;font-size:12px;color:#8A8780;text-transform:uppercase;letter-spacing:0.05em;">Precio anterior</th>
            <th style="text-align:left;padding:8px 0;font-size:12px;color:#8A8780;text-transform:uppercase;letter-spacing:0.05em;">Precio nuevo</th>
          </tr>
        </thead>
        <tbody>
          ${filaMensual}
          ${filaAnual}
        </tbody>
      </table>
    </div>

    <p>Tu suscripción activa no se ve afectada hasta la próxima renovación.</p>
    <p style="font-size:13px;color:#8A8780;">
      Si tenés alguna consulta sobre este cambio,
      <a href="${process.env.FRONTEND_URL}" style="color:#B86030;text-decoration:none;">comunicate con nosotros</a>.
    </p>
  `;

  return enviarEmail({
    to:      email,
    subject: `📋 Actualización de precios — Plan ${planNombre} — IUSTIXIUM`,
    html:    templateBase(`Actualización de precios: ${planNombre}`, contenido),
  });
};

// ─────────────────────────────────────────────────────────────
// Exportar todo
// ─────────────────────────────────────────────────────────────
module.exports = {
  enviarBienvenida,
  notificarAbogadoPendiente,
  notificarAbogadoAprobado,
  notificarAbogadoRechazado,
  notificarNuevaConsulta,
  enviarConfirmacionTurno,
  enviarResetPassword,
  notificarCuentaDeshabilitada,
  notificarCuentaRehabilitada,
  notificarAdminNuevoAbogado,
  enviarComunicado,
  enviarConfirmacionSuscripcion,
  notificarCambioPreciosPlan,
};
