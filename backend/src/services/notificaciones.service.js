// ============================================================
// src/services/notificaciones.service.js
// Servicio central de notificaciones
// Guarda en DB + emite por Socket.io + (futuro) email
// ============================================================

const { query } = require('../config/database');

// El io se inyecta desde server.js al inicializar
let _io = null;

function setIO(io) { _io = io; }

// ─────────────────────────────────────────────────────────────
// TIPOS de notificación y su configuración
// ─────────────────────────────────────────────────────────────
const TIPOS = {
  // Cliente
  consulta_confirmada:  { icono: '✅', importante: true  },
  consulta_rechazada:   { icono: '❌', importante: true  },
  consulta_cancelada:   { icono: '❌', importante: false },
  mensaje_abogado:      { icono: '💬', importante: true  },
  // Abogado
  nueva_consulta:       { icono: '📅', importante: true  },
  mensaje_cliente:      { icono: '💬', importante: true  },
  mensaje_foro:         { icono: '💬', importante: false },
  perfil_aprobado:      { icono: '✅', importante: true  },
  perfil_rechazado:     { icono: '❌', importante: true  },
  cambio_plan:          { icono: '📋', importante: true  },
  // Admin
  nuevo_abogado:        { icono: '👤', importante: true  },
  cambio_plan_solicitado: { icono: '💳', importante: true },
  // Manual (admin → usuarios)
  comunicado:           { icono: '📢', importante: false },
  // Documentos
  nueva_calificacion:   { icono: '⭐', importante: false },
  documento_aprobado:   { icono: '✅', importante: true  },
  documento_rechazado:  { icono: '❌', importante: true  },
  nuevo_documento:      { icono: '📄', importante: true  },
};

// ─────────────────────────────────────────────────────────────
// Crear y emitir una notificación
// ─────────────────────────────────────────────────────────────
async function crear({ usuarioId, tipo, titulo, mensaje, link = null }) {
  try {
    // 1. Guardar en DB
    const { rows: [notif] } = await query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tipo, titulo, mensaje, link, leida, creado_en`,
      [usuarioId, tipo, titulo, mensaje, link]
    );

    // 2. Emitir por socket al usuario si está conectado
    if (_io) {
      _io.to(`user_${usuarioId}`).emit('notificacion', {
        ...notif,
        icono: TIPOS[tipo]?.icono || '🔔',
      });
    }

    // 3. Email para notificaciones importantes
    // Usa enviarComunicado (función real y testeada) en lugar del
    // placeholder enviarNotificacion que nunca existió
    if (TIPOS[tipo]?.importante) {
      try {
        const { rows: [usuario] } = await query(
          'SELECT email, nombre FROM usuarios WHERE id = $1', [usuarioId]
        );
        if (usuario) {
          const emailService = require('./email.service');
          emailService.enviarComunicado({
            destinatarioEmail:  usuario.email,
            destinatarioNombre: usuario.nombre,
            titulo,
            mensaje,
            link: link || null,
          }).catch(() => {}); // silencioso — la notificación in-app ya fue guardada
        }
      } catch {}
    }

    return notif;
  } catch (err) {
    console.error('Error creando notificación:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Crear para múltiples usuarios a la vez
// ─────────────────────────────────────────────────────────────
async function crearBulk({ usuarioIds, tipo, titulo, mensaje, link = null }) {
  const resultados = await Promise.allSettled(
    usuarioIds.map(id => crear({ usuarioId: id, tipo, titulo, mensaje, link }))
  );
  return resultados.filter(r => r.status === 'fulfilled').map(r => r.value);
}

// ─────────────────────────────────────────────────────────────
// Helpers semánticos — llamados desde rutas/controllers
// ─────────────────────────────────────────────────────────────

// Nuevo abogado registrado → admin
async function nuevoAbogadoRegistrado({ abogadoNombre, abogadoEmail }) {
  const { rows: admins } = await query(
    `SELECT u.id FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = 'admin'`
  );
  await crearBulk({
    usuarioIds: admins.map(a => a.id),
    tipo:       'nuevo_abogado',
    titulo:     'Nuevo abogado pendiente de revisión',
    mensaje:    `${abogadoNombre} (${abogadoEmail}) se registró y espera aprobación.`,
    link:       '/admin/abogados',
  });
}

// Consulta confirmada → cliente
async function consultaConfirmada({ clienteId, abogadoNombre, fecha, consultaId }) {
  await crear({
    usuarioId: clienteId,
    tipo:      'consulta_confirmada',
    titulo:    '✅ Consulta confirmada',
    mensaje:   `Dr./Dra. ${abogadoNombre} confirmó tu consulta del ${fecha}.`,
    link:      `/mis-consultas/${consultaId}`,
  });
}

// Consulta rechazada/cancelada → cliente
async function consultaRechazada({ clienteId, abogadoNombre, consultaId }) {
  await crear({
    usuarioId: clienteId,
    tipo:      'consulta_rechazada',
    titulo:    '❌ Consulta no confirmada',
    mensaje:   `Dr./Dra. ${abogadoNombre} no pudo confirmar tu consulta. Podés buscar otro profesional.`,
    link:      `/mis-consultas/${consultaId}`,
  });
}

// Nueva consulta recibida → abogado
async function nuevaConsulta({ abogadoId, clienteNombre, fecha, consultaId }) {
  await crear({
    usuarioId: abogadoId,
    tipo:      'nueva_consulta',
    titulo:    '📅 Nueva solicitud de consulta',
    mensaje:   `${clienteNombre} solicitó una consulta para el ${fecha}.`,
    link:      `/abogado/consultas/${consultaId}`,
  });
}

// Nuevo mensaje → destinatario
async function nuevoMensaje({ destinatarioId, remitenteNombre, consultaId, esAbogado }) {
  await crear({
    usuarioId: destinatarioId,
    tipo:      esAbogado ? 'mensaje_cliente' : 'mensaje_abogado',
    titulo:    `💬 Nuevo mensaje de ${remitenteNombre}`,
    mensaje:   `Tenés un mensaje nuevo en tu consulta.`,
    link:      esAbogado
      ? `/abogado/consultas/${consultaId}`
      : `/mis-consultas/${consultaId}`,
  });
}

// Perfil aprobado → abogado
async function perfilAprobado({ abogadoId, abogadoNombre }) {
  await crear({
    usuarioId: abogadoId,
    tipo:      'perfil_aprobado',
    titulo:    '🎉 ¡Tu perfil fue aprobado!',
    mensaje:   `Dr./Dra. ${abogadoNombre}, tu perfil ya está visible para los clientes.`,
    link:      '/abogado/dashboard',
  });
}

// Perfil rechazado → abogado
async function perfilRechazado({ abogadoId, motivo }) {
  await crear({
    usuarioId: abogadoId,
    tipo:      'perfil_rechazado',
    titulo:    '❌ Tu perfil no fue aprobado',
    mensaje:   motivo || 'Tu perfil no cumple con los requisitos. Contactá al equipo de soporte.',
    link:      '/abogado/dashboard',
  });
}

// Comunicado manual del admin
async function comunicadoAdmin({ usuarioIds, titulo, mensaje, link }) {
  await crearBulk({ usuarioIds, tipo: 'comunicado', titulo, mensaje, link: link || null });
}

module.exports = {
  setIO,
  crear,
  crearBulk,
  nuevoAbogadoRegistrado,
  consultaConfirmada,
  consultaRechazada,
  nuevaConsulta,
  nuevoMensaje,
  perfilAprobado,
  perfilRechazado,
  comunicadoAdmin,
};
