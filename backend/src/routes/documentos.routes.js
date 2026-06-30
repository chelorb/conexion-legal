// ============================================================
// src/routes/documentos.routes.js
// Gestión de documentos de abogados con Cloudinary
// ============================================================

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const { query }  = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');
const cloudSvc   = require('../services/cloudinary.service');
const notifSvc   = require('../services/notificaciones.service');
const emailSvc   = require('../services/email.service');
const auditar    = require('../services/auditoria.service'); // log de acciones del abogado

// Multer en memoria (los archivos van directo a Cloudinary, no al disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.'));
  },
});

const TIPOS = {
  credencial: 'Credencial del letrado',
  titulo:     'Título universitario',
  cuil:       'Constancia de CUIL',
  otro:       'Documento adicional',
};

// ─────────────────────────────────────────────────────────────
// GET /api/documentos/mis-documentos
// El abogado ve sus propios documentos
// ─────────────────────────────────────────────────────────────
router.get('/mis-documentos', verificarToken, requireRol('abogado'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tipo, nombre, url, estado, motivo_rechazo, creado_en, revisado_en
       FROM documentos_abogado
       WHERE abogado_id = $1
       ORDER BY creado_en DESC`,
      [req.usuario.id]
    );
    res.json({ documentos: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/documentos/subir
// El abogado sube un documento nuevo (queda pendiente)
// ─────────────────────────────────────────────────────────────
router.post('/subir', verificarToken, requireRol('abogado'), upload.single('archivo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    const { tipo = 'otro', nombre } = req.body;
    if (!TIPOS[tipo]) return res.status(400).json({ error: 'Tipo de documento inválido.' });

    const abogadoId = req.usuario.id;

    // Subir a Cloudinary
    const resultado = await cloudSvc.subirArchivo(req.file.buffer, {
      folder:    `conexion-legal/abogados/${abogadoId}`,
      public_id: `${tipo}_${Date.now()}`,
      resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });

    // Guardar en DB
    const { rows: [doc] } = await query(
      `INSERT INTO documentos_abogado
         (abogado_id, tipo, nombre, cloudinary_id, url, estado)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')
       RETURNING id, tipo, nombre, url, estado, creado_en`,
      [abogadoId, tipo, nombre || TIPOS[tipo], resultado.public_id, resultado.url]
    );

    // Notificar al admin
    const { rows: admins } = await query(
      `SELECT u.id, u.nombre, u.email
       FROM usuarios u JOIN roles r ON u.rol_id = r.id
       WHERE r.nombre = 'admin'`
    );

    const { rows: [abogado] } = await query(
      'SELECT nombre, apellido FROM usuarios WHERE id = $1', [abogadoId]
    );

    await Promise.allSettled(admins.map(async admin => {
      await notifSvc.crear({
        usuarioId: admin.id,
        tipo:      'nuevo_documento',
        titulo:    '📄 Nuevo documento para revisar',
        mensaje:   `Dr./Dra. ${abogado.nombre} ${abogado.apellido} subió: ${nombre || TIPOS[tipo]}`,
        link:      '/admin/abogados',
      });
    }));

    // Registrar en auditoría — el abogado subió un documento
    await auditar(req, {
      accion:        'abogado_subio_documento',
      descripcion:   `El abogado subió el documento: ${nombre || TIPOS[tipo]}`,
      entidad:       'documento',
      entidad_id:    doc.id,
      entidad_label: `${nombre || TIPOS[tipo]} (${tipo})`,
      datos_despues: { tipo, nombre: nombre || TIPOS[tipo], estado: 'pendiente' },
    }).catch(() => {}); // no cortar el flujo si falla la auditoría

    res.status(201).json({ documento: doc });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/documentos/abogado/:id
// Admin ve los documentos de un abogado específico
// ─────────────────────────────────────────────────────────────
router.get('/abogado/:id', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tipo, nombre, url, estado, motivo_rechazo, creado_en, revisado_en
       FROM documentos_abogado
       WHERE abogado_id = $1
       ORDER BY creado_en DESC`,
      [req.params.id]
    );
    res.json({ documentos: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/documentos/admin/subir/:abogadoId
// Admin sube un documento para un abogado
// ─────────────────────────────────────────────────────────────
router.post('/admin/subir/:abogadoId', verificarToken, requireRol('admin'), upload.single('archivo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    const { tipo = 'otro', nombre } = req.body;
    const { abogadoId } = req.params;

    const resultado = await cloudSvc.subirArchivo(req.file.buffer, {
      folder:    `conexion-legal/abogados/${abogadoId}`,
      public_id: `${tipo}_${Date.now()}`,
      resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });

    // El admin sube → queda aprobado directamente
    const { rows: [doc] } = await query(
      `INSERT INTO documentos_abogado
         (abogado_id, tipo, nombre, cloudinary_id, url, estado, revisado_por, revisado_en)
       VALUES ($1, $2, $3, $4, $5, 'aprobado', $6, NOW())
       RETURNING id, tipo, nombre, url, estado, creado_en`,
      [abogadoId, tipo, nombre || TIPOS[tipo], resultado.public_id, resultado.url, req.usuario.id]
    );

    res.status(201).json({ documento: doc });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/documentos/:id/revisar
// Admin aprueba o rechaza un documento
// ─────────────────────────────────────────────────────────────
router.patch('/:id/revisar', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { estado, motivo } = req.body;
    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser aprobado o rechazado.' });
    }

    const { rows: [doc] } = await query(
      `UPDATE documentos_abogado SET
         estado         = $1,
         motivo_rechazo = $2,
         revisado_por   = $3,
         revisado_en    = NOW()
       WHERE id = $4
       RETURNING abogado_id, tipo, nombre`,
      [estado, motivo || null, req.usuario.id, req.params.id]
    );

    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    // Obtener datos del abogado para notificarle
    const { rows: [abogado] } = await query(
      'SELECT nombre, apellido, email FROM usuarios WHERE id = $1',
      [doc.abogado_id]
    );

    // Notificación in-app al abogado
    await notifSvc.crear({
      usuarioId: doc.abogado_id,
      tipo:      estado === 'aprobado' ? 'documento_aprobado' : 'documento_rechazado',
      titulo:    estado === 'aprobado'
        ? `✅ Documento aprobado`
        : `❌ Documento no aprobado`,
      mensaje: estado === 'aprobado'
        ? `Tu documento "${doc.nombre}" fue aprobado.`
        : `Tu documento "${doc.nombre}" fue rechazado. ${motivo || ''}`,
      link: '/abogado/documentos',
    });

    // Email al abogado
    emailSvc.enviarComunicado({
      destinatarioEmail:  abogado.email,
      destinatarioNombre: `${abogado.nombre} ${abogado.apellido}`,
      titulo:  estado === 'aprobado' ? '✅ Documento aprobado' : '❌ Documento no aprobado',
      mensaje: estado === 'aprobado'
        ? `Tu documento "${doc.nombre}" fue aprobado por nuestro equipo.`
        : `Tu documento "${doc.nombre}" no fue aprobado. Motivo: ${motivo || 'Contactá al soporte.'}`,
      link: '/abogado/documentos',
    }).catch(() => {});

    res.json({ mensaje: `Documento ${estado}.` });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/documentos/:id
// Eliminar un documento — abogado (solo el suyo, no aprobado)
//                       — admin  (cualquiera)
// La lógica de permisos se valida dentro del handler
// ─────────────────────────────────────────────────────────────
router.delete('/:id', verificarToken, requireRol('abogado', 'admin'), async (req, res, next) => {
  try {
    const esAdmin   = req.usuario.rol === 'admin';
    const esAbogado = req.usuario.rol === 'abogado';

    if (!esAdmin && !esAbogado) {
      return res.status(403).json({ error: 'Sin permisos.' });
    }

    const { rows: [doc] } = await query(
      `SELECT id, abogado_id, cloudinary_id, estado, nombre
       FROM documentos_abogado WHERE id = $1`,
      [req.params.id]
    );

    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    // El abogado solo puede eliminar sus propios documentos no aprobados
    if (esAbogado) {
      if (doc.abogado_id !== req.usuario.id) {
        return res.status(403).json({ error: 'No tenés permiso para eliminar este documento.' });
      }
      if (doc.estado === 'aprobado') {
        return res.status(403).json({ error: 'No podés eliminar un documento ya aprobado. Contactá al administrador.' });
      }
    }

    // Eliminar de Cloudinary
    await cloudSvc.eliminarArchivo(doc.cloudinary_id);

    // Eliminar de DB
    await query('DELETE FROM documentos_abogado WHERE id = $1', [req.params.id]);

    res.json({ mensaje: 'Documento eliminado.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/documentos/pendientes
// Admin ve todos los documentos pendientes de revisión
// ─────────────────────────────────────────────────────────────
router.get('/pendientes', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         da.id, da.tipo, da.nombre, da.url, da.estado, da.creado_en,
         u.nombre AS abogado_nombre, u.apellido AS abogado_apellido,
         u.email  AS abogado_email
       FROM documentos_abogado da
       JOIN usuarios u ON da.abogado_id = u.id
       WHERE da.estado = 'pendiente'
       ORDER BY da.creado_en ASC`
    );
    res.json({ documentos: rows });
  } catch (error) { next(error); }
});

module.exports = router;
