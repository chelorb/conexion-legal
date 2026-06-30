// ============================================================
// src/controllers/pagos.controller.js
// Integración con MercadoPago para suscripciones de abogados
// ============================================================

const { query, getClient } = require('../config/database');
const emailService = require('../services/email.service');

// Inicializar el SDK de MercadoPago con las credenciales
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ─────────────────────────────────────────────────────────────
// POST /api/pagos/crear-preferencia
// Crea una preferencia de pago en MercadoPago
// El frontend redirige al checkout de MP con la URL devuelta
// ─────────────────────────────────────────────────────────────
const crearPreferencia = async (req, res, next) => {
  try {
    const { plan_slug, periodo } = req.body; // periodo: 'mensual' | 'anual'
    const usuarioId = req.usuario.id;

    // Obtener el plan solicitado
    const { rows: planes } = await query(
      'SELECT * FROM planes_suscripcion WHERE slug = $1 AND activo = true',
      [plan_slug]
    );

    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    const plan = planes[0];

    // No procesar pagos para el plan gratuito
    if (plan.precio_mensual === 0 && plan.precio_anual === 0) {
      return res.status(400).json({ error: 'El plan gratuito no requiere pago.' });
    }

    // Calcular precio según período
    const precio = periodo === 'anual' ? plan.precio_anual : plan.precio_mensual;
    const descripcionPeriodo = periodo === 'anual' ? 'anual' : 'mensual';

    // Obtener datos del usuario para la preferencia
    const { rows: [usuario] } = await query(
      'SELECT nombre, apellido, email FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    // Crear la preferencia en MercadoPago
    const preferenceClient = new Preference(mpClient);

    const preferencia = await preferenceClient.create({
      body: {
        items: [
          {
            id:          plan.slug,
            title:       `IUSTIXIUM — Plan ${plan.nombre} (${descripcionPeriodo})`,
            description: `Suscripción ${descripcionPeriodo} al Plan ${plan.nombre} de IUSTIXIUM`,
            quantity:    1,
            currency_id: 'ARS',
            unit_price:  parseFloat(precio),
          }
        ],
        payer: {
          name:    usuario.nombre,
          surname: usuario.apellido,
          email:   usuario.email,
        },
        back_urls: {
          // MercadoPago redirige aquí después del pago
          success: `${process.env.FRONTEND_URL}/pago/exitoso?plan=${plan_slug}`,
          failure: `${process.env.FRONTEND_URL}/pago/fallido`,
          pending: `${process.env.FRONTEND_URL}/pago/pendiente`,
        },
        auto_return: 'approved', // Redirige automáticamente si el pago fue aprobado
        external_reference: `${usuarioId}|${plan.id}|${periodo}`, // Para identificar en webhook
        // BACKEND_URL debe estar configurado en Render con la URL real del backend
        // Ej: https://conexion-legal.onrender.com
        notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
      }
    });

    res.json({
      preferencia_id:  preferencia.id,
      checkout_url:    preferencia.init_point,    // URL de producción
      checkout_url_sandbox: preferencia.sandbox_init_point, // URL de prueba
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pagos/webhook
// MercadoPago llama a este endpoint cuando el estado del pago cambia
// IMPORTANTE: Este endpoint debe ser público (sin autenticación JWT)
// ─────────────────────────────────────────────────────────────
const webhook = async (req, res, next) => {
  const client = await getClient();
  try {
    const { type, data } = req.body;

    // Solo procesar notificaciones de pagos
    if (type !== 'payment') {
      return res.sendStatus(200); // Responder 200 para que MP no reintente
    }

    // Obtener los detalles completos del pago desde la API de MP
    const paymentClient = new Payment(mpClient);
    const pago = await paymentClient.get({ id: data.id });

    // Solo procesar pagos aprobados
    if (pago.status !== 'approved') {
      // Registrar el intento igual para auditoría
      await query(
        `INSERT INTO pagos (mp_payment_id, mp_status, mp_status_detail, monto, moneda)
         VALUES ($1, $2, $3, $4, 'ARS')
         ON CONFLICT (mp_payment_id) DO NOTHING`,
        [pago.id.toString(), pago.status, pago.status_detail, pago.transaction_amount]
      );
      return res.sendStatus(200);
    }

    // Parsear la referencia externa para obtener los datos del usuario y plan
    // Formato: "usuarioId|planId|periodo"
    const [usuarioId, planId, periodo] = (pago.external_reference || '').split('|');

    if (!usuarioId || !planId) {
      console.error('Webhook MP: referencia externa inválida:', pago.external_reference);
      return res.sendStatus(200);
    }

    await client.query('BEGIN');

    // Calcular fechas de la suscripción
    const inicio = new Date();
    const fin    = new Date();
    if (periodo === 'anual') {
      fin.setFullYear(fin.getFullYear() + 1);
    } else {
      fin.setMonth(fin.getMonth() + 1);
    }

    // Registrar el pago
    await client.query(
      `INSERT INTO pagos
         (usuario_id, plan_id, mp_payment_id, mp_status, mp_status_detail,
          monto, descripcion, periodo, periodo_inicio, periodo_fin)
       VALUES ($1, $2, $3, 'approved', $4, $5, $6, $7, $8, $9)
       ON CONFLICT (mp_payment_id) DO NOTHING`,
      [
        usuarioId, planId, pago.id.toString(),
        pago.status_detail, pago.transaction_amount,
        `Plan ${planId} - ${periodo}`, periodo, inicio, fin
      ]
    );

    // Activar la suscripción del abogado
    await client.query(
      `UPDATE perfiles_abogado SET
         plan_id            = $1,
         suscripcion_activa = true,
         suscripcion_inicio = $2,
         suscripcion_fin    = $3,
         mp_subscription_id = $4
       WHERE usuario_id = $5`,
      [planId, inicio, fin, pago.id.toString(), usuarioId]
    );

    // Notificación en la app
    await client.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
       VALUES ($1, 'suscripcion', '🎉 ¡Suscripción activada!',
               'Tu suscripción fue procesada exitosamente. Ya podés usar todas las funciones de tu plan.',
               '/abogado/suscripcion')`,
      [usuarioId]
    );

    await client.query('COMMIT');

    // Enviar email de confirmación
    const { rows: [plan] } = await query(
      'SELECT nombre FROM planes_suscripcion WHERE id = $1', [planId]
    );
    const { rows: [usuario] } = await query(
      'SELECT nombre, apellido, email FROM usuarios WHERE id = $1', [usuarioId]
    );

    if (usuario && plan) {
      emailService.enviarConfirmacionSuscripcion({
        nombre:  `${usuario.nombre} ${usuario.apellido}`,
        email:   usuario.email,
        plan:    plan.nombre,
        fechaFin: fin,
      });
    }

    res.sendStatus(200);

  } catch (error) {
    await client.query('ROLLBACK');
    // No pasar el error al handler global para no devolver 500 a MP
    console.error('❌ Error en webhook de MercadoPago:', error);
    res.sendStatus(200); // Siempre responder 200 a MP para evitar reintentos
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/pagos/historial
// Historial de pagos del abogado autenticado
// ─────────────────────────────────────────────────────────────
const historialPagos = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.monto, p.moneda, p.mp_status, p.descripcion,
              p.periodo, p.periodo_inicio, p.periodo_fin, p.creado_en,
              ps.nombre AS plan_nombre
       FROM pagos p
       JOIN planes_suscripcion ps ON p.plan_id = ps.id
       WHERE p.usuario_id = $1
       ORDER BY p.creado_en DESC`,
      [req.usuario.id]
    );

    res.json({ pagos: rows });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/pagos/planes
// Lista los planes disponibles con sus precios (público)
// ─────────────────────────────────────────────────────────────
const listarPlanes = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, nombre, slug, precio_mensual, precio_anual,
              aparece_en_grilla, max_consultas_mes, acceso_campus,
              acceso_campus_completo, gestion_turnos, perfil_validado,
              credencial_virtual, networking, beneficios_exclusivos,
              difusion_profesional
       FROM planes_suscripcion
       WHERE activo = true
       ORDER BY precio_mensual ASC`
    );

    res.json({ planes: rows });

  } catch (error) {
    next(error);
  }
};

module.exports = { crearPreferencia, webhook, historialPagos, listarPlanes };
