// ============================================================
// src/controllers/consultas.controller.js
// Gestión completa del sistema de turnos y consultas
// ============================================================

const { query, getClient } = require('../config/database');
const emailService = require('../services/email.service');

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

    // Crear notificación en la app para el abogado
    await client.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
       VALUES ($1, 'nueva_consulta', 'Nueva solicitud de consulta',
               'Tenés una nueva solicitud de consulta pendiente de confirmación.',
               '/abogado/consultas')`,
      [abogado_id]
    );

    await client.query('COMMIT');

    // Notificar al abogado por email (no bloqueamos)
    const { rows: [cliente] } = await query(
      'SELECT nombre, apellido FROM usuarios WHERE id = $1',
      [clienteId]
    );

    emailService.notificarNuevaConsulta({
      abogadoEmail:  abogadoData.email,
      abogadoNombre: `${abogadoData.nombre} ${abogadoData.apellido}`,
      clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
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
         uc.nombre  AS cliente_nombre,
         uc.apellido AS cliente_apellido,
         uc.telefono AS cliente_telefono,
         uc.avatar_url AS cliente_avatar,
         -- Datos del abogado
         ua.nombre  AS abogado_nombre,
         ua.apellido AS abogado_apellido,
         ua.avatar_url AS abogado_avatar,
         -- ¿Ya existe calificación?
         EXISTS(SELECT 1 FROM calificaciones cal WHERE cal.consulta_id = c.id) AS tiene_calificacion
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
    const esAbogado = rol === 'abogado' && consulta.abogado_id === usuarioId;
    const esCliente = rol === 'cliente' && consulta.cliente_id === usuarioId;

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

    // Enviar email si la consulta fue confirmada
    if (estado === 'confirmada') {
      emailService.enviarConfirmacionTurno({
        clienteNombre: consulta.cliente_nombre,
        clienteEmail:  consulta.cliente_email,
        abogadoNombre: consulta.abogado_nombre,
        fecha:         consulta.fecha_hora,
        tipo:          consulta.tipo,
        linkReunion:   link_reunion,
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

module.exports = { crearConsulta, listarConsultas, actualizarEstadoConsulta };
