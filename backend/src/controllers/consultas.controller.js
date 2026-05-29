// ============================================================
// src/controllers/consultas.controller.js
// Gestión completa del sistema de turnos y consultas
// ============================================================

const { query, getClient } = require('../config/database');
const emailService = require('../services/email.service');
const { format }    = require('date-fns');
const notifService  = require('../services/notificaciones.service');
const { es }        = require('date-fns/locale');

// ─────────────────────────────────────────────────────────────
// POST /api/consultas
// El cliente solicita una nueva consulta con un abogado
// ─────────────────────────────────────────────────────────────
const crearConsulta = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { abogado_id, tipo, descripcion, fecha_hora, especialidad } = req.body;
    const clienteId = req.usuario.id;

    // Verificar que el abogado existe y está visible
    const { rows: abogado } = await client.query(
      `SELECT u.id, u.nombre, u.apellido, u.email,
              pa.plan_id, pa.suscripcion_activa,
              ps.gestion_turnos, ps.max_consultas_mes
       FROM usuarios u
       JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE u.id = $1 AND pa.visible_en_grilla = true AND u.activo = true`,
      [abogado_id]
    );

    if (abogado.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Abogado no encontrado o no disponible.' });
    }

    const abogadoData = abogado[0];

    // Verificar que el plan del abogado permite gestión de turnos
    if (!abogadoData.gestion_turnos) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Este abogado no tiene habilitada la gestión de turnos online.'
      });
    }

    // Verificar que no existe otra consulta en el mismo horario para este abogado
    const { rows: conflicto } = await client.query(
      `SELECT id FROM consultas
       WHERE abogado_id = $1
         AND estado IN ('pendiente', 'confirmada')
         AND ABS(EXTRACT(EPOCH FROM (fecha_hora - $2))) < 3600`,
       // Bloquea si hay otra consulta dentro de 1 hora del horario solicitado
      [abogado_id, fecha_hora]
    );

    if (conflicto.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'El abogado ya tiene una consulta en ese horario. Por favor elegí otro.'
      });
    }

    // Verificar límite mensual de consultas si el plan tiene límite
    if (abogadoData.max_consultas_mes !== null) {
      const { rows: conteo } = await client.query(
        `SELECT COUNT(*) AS total FROM consultas
         WHERE abogado_id = $1
           AND estado != 'cancelada'
           AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', NOW())`,
        [abogado_id]
      );

      if (parseInt(conteo[0].total) >= abogadoData.max_consultas_mes) {
        await client.query('ROLLBACK');
        return res.status(429).json({
          error: 'Este abogado alcanzó el límite de consultas para este mes. Intentá el mes próximo.'
        });
      }
    }

    // Crear la consulta
    const { rows: [consulta] } = await client.query(
      `INSERT INTO consultas
         (cliente_id, abogado_id, tipo, descripcion, fecha_hora, especialidad)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clienteId, abogado_id, tipo, descripcion, fecha_hora, especialidad]
    );

    await client.query('COMMIT');

    // Notificación real-time al abogado (via Socket.io + guarda en DB)
    const { rows: [clienteData] } = await query(
      'SELECT nombre, apellido FROM usuarios WHERE id = $1', [clienteId]
    );
    await notifService.nuevaConsulta({
      abogadoId:     abogado_id,
      clienteNombre: `${clienteData.nombre} ${clienteData.apellido}`,
      fecha:         format(new Date(fecha_hora), "d 'de' MMMM, HH:mm 'hs'", { locale: es }),
      consultaId:    consulta.id,
    });

    emailService.notificarNuevaConsulta({
      abogadoEmail:  abogadoData.email,
      abogadoNombre: `${abogadoData.nombre} ${abogadoData.apellido}`,
      clienteNombre: `${clienteData.nombre} ${clienteData.apellido}`,
      fecha:         fecha_hora,
      especialidad,
    });

    res.status(201).json({
      mensaje: 'Solicitud de consulta enviada. El abogado la confirmará a la brevedad.',
      consulta,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/consultas
// Lista las consultas del usuario autenticado (cliente o abogado)
// ─────────────────────────────────────────────────────────────
const listarConsultas = async (req, res, next) => {
  try {
    const { rol, id: usuarioId } = req.usuario;
    const { estado, pagina = 1, limite = 10 } = req.query;

    // El filtro cambia según si es cliente o abogado
    const filtroRol = rol === 'abogado'
      ? 'c.abogado_id = $1'
      : 'c.cliente_id = $1';

    const condiciones = [filtroRol];
    const params = [usuarioId];
    let idx = 2;

    if (estado) {
      condiciones.push(`c.estado = $${idx++}`);
      params.push(estado);
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    params.push(parseInt(limite), offset);

    const { rows } = await query(
      `SELECT
         c.id, c.tipo, c.fecha_hora, c.estado, c.especialidad,
         c.descripcion, c.link_reunion, c.creado_en,
         -- Datos del cliente
         uc.nombre     AS cliente_nombre,
         uc.apellido   AS cliente_apellido,
         uc.telefono   AS cliente_telefono,
         uc.avatar_url AS cliente_avatar,
         -- Datos del abogado
         ua.nombre     AS abogado_nombre,
         ua.apellido   AS abogado_apellido,
         ua.avatar_url AS abogado_avatar,
         -- ¿Ya existe calificación?
         EXISTS(
           SELECT 1 FROM calificaciones cal WHERE cal.consulta_id = c.id
         ) AS tiene_calificacion,
         -- Mensajes no leídos para el usuario actual
         (
           SELECT COUNT(*) FROM mensajes_consulta m
           WHERE m.consulta_id = c.id
             AND m.autor_id != $1
             AND m.leido = false
         ) AS mensajes_no_leidos
       FROM consultas c
       JOIN usuarios uc ON c.cliente_id  = uc.id
       JOIN usuarios ua ON c.abogado_id  = ua.id
       WHERE ${condiciones.join(' AND ')}
       ORDER BY c.fecha_hora DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ consultas: rows });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/consultas/:id/estado
// El abogado confirma, cancela, o completa una consulta
// ─────────────────────────────────────────────────────────────
const actualizarEstadoConsulta = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { estado, motivo_cancelacion, link_reunion } = req.body;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    // Verificar que la consulta existe y pertenece al usuario
    const { rows } = await client.query(
      `SELECT c.*, uc.nombre AS cliente_nombre, uc.email AS cliente_email,
              ua.nombre AS abogado_nombre
       FROM consultas c
       JOIN usuarios uc ON c.cliente_id = uc.id
       JOIN usuarios ua ON c.abogado_id = ua.id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    const consulta = rows[0];

    // Verificar permisos: solo el abogado o el cliente de la consulta pueden modificarla
    const esAbogado = rol === 'abogado' && String(consulta.abogado_id) === String(usuarioId);
    const esCliente = rol === 'cliente' && String(consulta.cliente_id) === String(usuarioId);

    if (!esAbogado && !esCliente && rol !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tenés permisos para modificar esta consulta.' });
    }

    // Validar transiciones de estado permitidas
    const transicionesPermitidas = {
      abogado: {
        pendiente:  ['confirmada', 'cancelada'],
        confirmada: ['completada', 'cancelada', 'no_asistio'],
        en_curso:   ['completada'],
      },
      cliente: {
        pendiente:  ['cancelada'],
        confirmada: ['cancelada'],
      },
      admin: {
        pendiente:  ['confirmada', 'cancelada'],
        confirmada: ['completada', 'cancelada'],
        en_curso:   ['completada', 'cancelada'],
      }
    };

    const rolKey = esAbogado ? 'abogado' : esCliente ? 'cliente' : 'admin';
    const permitidos = transicionesPermitidas[rolKey]?.[consulta.estado] || [];

    if (!permitidos.includes(estado)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `No se puede cambiar el estado de "${consulta.estado}" a "${estado}".`
      });
    }

    // Actualizar el estado
    const { rows: [actualizada] } = await client.query(
      `UPDATE consultas SET
         estado = $1,
         cancelada_por = $2,
         motivo_cancelacion = $3,
         link_reunion = COALESCE($4, link_reunion)
       WHERE id = $5
       RETURNING *`,
      [
        estado,
        estado === 'cancelada' ? rolKey : null,
        motivo_cancelacion || null,
        link_reunion || null,
        id
      ]
    );

    // Si la consulta se completó, actualizar el contador del abogado
    if (estado === 'completada') {
      await client.query(
        'UPDATE perfiles_abogado SET consultas_completadas = consultas_completadas + 1 WHERE usuario_id = $1',
        [consulta.abogado_id]
      );
    }

    // Notificación en la app para el destinatario
    const notifDestinatario = esAbogado ? consulta.cliente_id : consulta.abogado_id;
    const mensajesNotif = {
      confirmada:  '✅ Tu consulta fue confirmada por el abogado',
      cancelada:   '❌ Una consulta fue cancelada',
      completada:  '🎉 La consulta fue marcada como completada. ¡No olvides dejar tu calificación!',
      no_asistio:  'ℹ️ La consulta fue marcada como "no asistió"',
    };

    if (mensajesNotif[estado]) {
      await client.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          notifDestinatario,
          estado,
          mensajesNotif[estado],
          `Consulta del ${new Date(consulta.fecha_hora).toLocaleDateString('es-AR')}`,
          '/mis-consultas'
        ]
      );
    }

    await client.query('COMMIT');

    // Notificaciones real-time según el nuevo estado
    const fechaFormato = format(new Date(consulta.fecha_hora), "d 'de' MMMM, HH:mm 'hs'", { locale: es });

    if (estado === 'confirmada') {
      // Email + notif al cliente
      emailService.enviarConfirmacionTurno({
        clienteNombre: consulta.cliente_nombre,
        clienteEmail:  consulta.cliente_email,
        abogadoNombre: consulta.abogado_nombre,
        fecha:         consulta.fecha_hora,
        tipo:          consulta.tipo,
        linkReunion:   link_reunion,
      });
      await notifService.consultaConfirmada({
        clienteId:    consulta.cliente_id,
        abogadoNombre: consulta.abogado_nombre,
        fecha:         fechaFormato,
        consultaId:    id,
      });
    }

    if (estado === 'cancelada' && req.usuario.rol === 'abogado') {
      // El abogado canceló → avisar al cliente
      await notifService.consultaRechazada({
        clienteId:    consulta.cliente_id,
        abogadoNombre: consulta.abogado_nombre,
        consultaId:    id,
      });
    }

    res.json({
      mensaje: 'Estado de la consulta actualizado.',
      consulta: actualizada,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// exports al final del archivo

// ─────────────────────────────────────────────────────────────
// GET /api/consultas/:id
// Detalle completo de una consulta (abogado o cliente)
// ─────────────────────────────────────────────────────────────
const obtenerConsulta = async (req, res, next) => {
  try {
    const { id }       = req.params;
    const usuarioId    = req.usuario.id;
    const rol          = req.usuario.rol;

    const { rows } = await query(
      `SELECT
         c.id, c.tipo, c.fecha_hora, c.estado, c.especialidad,
         c.descripcion, c.link_reunion, c.motivo_cancelacion,
         c.creado_en, c.duracion_min,
         -- Cliente
         uc.id AS cliente_id, uc.nombre AS cliente_nombre,
         uc.apellido AS cliente_apellido, uc.email AS cliente_email,
         uc.telefono AS cliente_telefono, uc.avatar_url AS cliente_avatar,
         -- Abogado
         ua.id AS abogado_id, ua.nombre AS abogado_nombre,
         ua.apellido AS abogado_apellido, ua.email AS abogado_email,
         -- Mensajes de respuesta
         (SELECT json_agg(
           json_build_object(
             'id', m.id, 'contenido', m.contenido,
             'autor_id', m.autor_id, 'creado_en', m.creado_en,
             'autor_nombre', u2.nombre, 'autor_rol', r2.nombre
           ) ORDER BY m.creado_en ASC
         )
         FROM mensajes_consulta m
         JOIN usuarios u2 ON m.autor_id = u2.id
         JOIN roles r2 ON u2.rol_id = r2.id
         WHERE m.consulta_id = c.id
         ) AS mensajes
       FROM consultas c
       JOIN usuarios uc ON c.cliente_id  = uc.id
       JOIN usuarios ua ON c.abogado_id  = ua.id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    const consulta = rows[0];

    // Solo el abogado, el cliente o el admin pueden ver el detalle
    const puedeVer =
      rol === 'admin' ||
      (rol === 'abogado' && String(consulta.abogado_id) === String(usuarioId)) ||
      (rol === 'cliente' && String(consulta.cliente_id) === String(usuarioId));

    if (!puedeVer) {
      return res.status(403).json({ error: 'No tenés permisos para ver esta consulta.' });
    }

    // Marcar como leídos los mensajes del otro (no los propios)
    await query(
      `UPDATE mensajes_consulta
       SET leido = true
       WHERE consulta_id = $1 AND autor_id != $2 AND leido = false`,
      [id, usuarioId]
    );

    res.json({ consulta: { ...consulta, mensajes: consulta.mensajes || [] } });

  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────
// POST /api/consultas/:id/mensajes
// El abogado o cliente envía un mensaje en la consulta
// ─────────────────────────────────────────────────────────────
const enviarMensaje = async (req, res, next) => {
  try {
    const { id }       = req.params;
    const { contenido } = req.body;
    const usuarioId    = req.usuario.id;
    const rol          = req.usuario.rol;

    if (!contenido?.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    // Verificar que la consulta existe y el usuario es parte de ella
    const { rows } = await query(
      `SELECT c.id, c.cliente_id, c.abogado_id, c.estado,
              uc.nombre AS cliente_nombre, uc.email AS cliente_email,
              ua.nombre AS abogado_nombre, ua.email AS abogado_email
       FROM consultas c
       JOIN usuarios uc ON c.cliente_id = uc.id
       JOIN usuarios ua ON c.abogado_id = ua.id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada.' });
    }

    const consulta  = rows[0];
    const esAbogado = rol === 'abogado' && String(consulta.abogado_id) === String(usuarioId);
    const esCliente = rol === 'cliente' && String(consulta.cliente_id) === String(usuarioId);

    if (!esAbogado && !esCliente && rol !== 'admin') {
      return res.status(403).json({ error: 'No podés enviar mensajes en esta consulta.' });
    }

    if (['cancelada', 'completada', 'no_asistio'].includes(consulta.estado)) {
      return res.status(400).json({ error: 'No se pueden enviar mensajes en consultas finalizadas.' });
    }

    // Insertar el mensaje
    const { rows: [mensaje] } = await query(
      `INSERT INTO mensajes_consulta (consulta_id, autor_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING id, contenido, autor_id, creado_en`,
      [id, usuarioId, contenido.trim()]
    );

    // Notificar al otro participante
    const destinatarioId  = esAbogado ? consulta.cliente_id : consulta.abogado_id;
    const remitenteNombre = esAbogado ? consulta.abogado_nombre : consulta.cliente_nombre;

    // Notificación real-time al destinatario
    await notifService.nuevoMensaje({
      destinatarioId,
      remitenteNombre,
      consultaId: id,
      esAbogado,  // true = el que envía es el abogado → destinatario es cliente
    });

    res.status(201).json({ mensaje });

  } catch (error) { next(error); }
};

module.exports = {
  crearConsulta,
  listarConsultas,
  actualizarEstadoConsulta,
  obtenerConsulta,
  enviarMensaje,
};
