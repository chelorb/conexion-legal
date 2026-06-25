// ============================================================
// src/routes/foro.routes.js
// Foro interno para abogados de la Comunidad
// Endpoints: categorías, hilos y respuestas
// ============================================================

const express = require('express');
const router  = express.Router();
const { query, getClient } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

// Todos los endpoints del foro requieren ser abogado o admin autenticado
router.use(verificarToken, requireRol('abogado', 'admin'));

// ─────────────────────────────────────────────────────────────
// GET /api/foro/categorias
// Lista todas las categorías con conteo de hilos
// ─────────────────────────────────────────────────────────────
router.get('/categorias', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         fc.id, fc.nombre, fc.descripcion, fc.icono, fc.orden,
         COUNT(fh.id) AS total_hilos,
         -- Último hilo de la categoría para mostrar actividad reciente
         MAX(fh.actualizado_en) AS ultima_actividad
       FROM foro_categorias fc
       LEFT JOIN foro_hilos fh ON fc.id = fh.categoria_id AND fh.cerrado = false
       WHERE fc.activa = true
       GROUP BY fc.id
       ORDER BY fc.orden ASC`
    );
    res.json({ categorias: rows });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/foro/categorias/:id/hilos
// Lista los hilos de una categoría con paginación
// ─────────────────────────────────────────────────────────────
router.get('/categorias/:id/hilos', async (req, res, next) => {
  try {
    const { id }       = req.params;
    const pagina       = parseInt(req.query.pagina) || 1;
    const limite       = 20;
    const offset       = (pagina - 1) * limite;

    const { rows: hilos } = await query(
      `SELECT
         fh.id, fh.titulo, fh.vistas, fh.fijado, fh.cerrado,
         fh.creado_en, fh.actualizado_en,
         -- Datos del autor
         u.nombre   AS autor_nombre,
         u.apellido AS autor_apellido,
         u.avatar_url AS autor_avatar,
         -- Plan del autor
         ps.slug AS autor_plan,
         -- Cantidad de respuestas
         COUNT(fr.id) AS total_respuestas
       FROM foro_hilos fh
       LEFT JOIN usuarios u    ON fh.autor_id = u.id
       LEFT JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       LEFT JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       LEFT JOIN foro_respuestas fr ON fh.id = fr.hilo_id
       WHERE fh.categoria_id = $1
       GROUP BY fh.id, u.nombre, u.apellido, u.avatar_url, ps.slug
       ORDER BY fh.fijado DESC, fh.actualizado_en DESC
       LIMIT $2 OFFSET $3`,
      [id, limite, offset]
    );

    // Datos de la categoría
    const { rows: cat } = await query(
      'SELECT id, nombre, descripcion, icono FROM foro_categorias WHERE id = $1',
      [id]
    );

    res.json({
      categoria: cat[0] || null,
      hilos,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/foro/categorias/:id/hilos
// Crear un nuevo hilo en una categoría
// ─────────────────────────────────────────────────────────────
router.post('/categorias/:id/hilos', async (req, res, next) => {
  try {
    const { titulo, contenido } = req.body;
    const { id: categoriaId }   = req.params;
    const autorId               = req.usuario.id;

    if (!titulo?.trim() || !contenido?.trim()) {
      return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
    }

    if (titulo.length > 255) {
      return res.status(400).json({ error: 'El título no puede superar 255 caracteres.' });
    }

    // Verificar que la categoría existe y está activa
    const { rows: cat } = await query(
      'SELECT id FROM foro_categorias WHERE id = $1 AND activa = true',
      [categoriaId]
    );
    if (cat.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    const { rows: [hilo] } = await query(
      `INSERT INTO foro_hilos (categoria_id, autor_id, titulo, contenido)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, creado_en`,
      [categoriaId, autorId, titulo.trim(), contenido.trim()]
    );

    res.status(201).json({
      mensaje: 'Hilo creado correctamente.',
      hilo,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/foro/hilos/:id
// Detalle de un hilo con todas sus respuestas
// ─────────────────────────────────────────────────────────────
router.get('/hilos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Incrementar contador de vistas
    await query('UPDATE foro_hilos SET vistas = vistas + 1 WHERE id = $1', [id]);

    // Datos del hilo y autor
    const { rows: hilos } = await query(
      `SELECT
         fh.id, fh.titulo, fh.contenido, fh.vistas,
         fh.fijado, fh.cerrado, fh.creado_en,
         fh.categoria_id,
         fc.nombre AS categoria_nombre, fc.icono AS categoria_icono,
         u.id AS autor_id, u.nombre AS autor_nombre,
         u.apellido AS autor_apellido, u.avatar_url AS autor_avatar,
         pa.anos_experiencia, pa.especialidades,
         ps.slug AS autor_plan
       FROM foro_hilos fh
       JOIN foro_categorias fc ON fh.categoria_id = fc.id
       LEFT JOIN usuarios u ON fh.autor_id = u.id
       LEFT JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       LEFT JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE fh.id = $1`,
      [id]
    );

    if (hilos.length === 0) {
      return res.status(404).json({ error: 'Hilo no encontrado.' });
    }

    // Todas las respuestas del hilo con datos del autor
    const { rows: respuestas } = await query(
      `SELECT
         fr.id, fr.contenido, fr.creado_en, fr.editado_en,
         u.id AS autor_id, u.nombre AS autor_nombre,
         u.apellido AS autor_apellido, u.avatar_url AS autor_avatar,
         pa.anos_experiencia, pa.especialidades,
         ps.slug AS autor_plan
       FROM foro_respuestas fr
       LEFT JOIN usuarios u ON fr.autor_id = u.id
       LEFT JOIN perfiles_abogado pa ON u.id = pa.usuario_id
       LEFT JOIN planes_suscripcion ps ON pa.plan_id = ps.id
       WHERE fr.hilo_id = $1
       ORDER BY fr.creado_en ASC`,
      [id]
    );

    res.json({
      hilo:       hilos[0],
      respuestas,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/foro/hilos/:id/respuestas
// Agregar una respuesta a un hilo
// ─────────────────────────────────────────────────────────────
router.post('/hilos/:id/respuestas', async (req, res, next) => {
  try {
    const { id: hiloId } = req.params;
    const { contenido }  = req.body;
    const autorId        = req.usuario.id;

    if (!contenido?.trim()) {
      return res.status(400).json({ error: 'El contenido de la respuesta es obligatorio.' });
    }

    // Verificar que el hilo existe y no está cerrado
    const { rows: hilo } = await query(
      `SELECT fh.id, fh.cerrado, fh.titulo, fh.autor_id,
              u.nombre AS autor_nombre
       FROM foro_hilos fh
       JOIN usuarios u ON fh.autor_id = u.id
       WHERE fh.id = $1`,
      [hiloId]
    );

    if (hilo.length === 0) {
      return res.status(404).json({ error: 'Hilo no encontrado.' });
    }

    if (hilo[0].cerrado) {
      return res.status(403).json({ error: 'Este hilo está cerrado. No se pueden agregar más respuestas.' });
    }

    const { rows: [respuesta] } = await query(
      `INSERT INTO foro_respuestas (hilo_id, autor_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING id, contenido, creado_en`,
      [hiloId, autorId, contenido.trim()]
    );

    // Notificar al autor del hilo si no es el mismo que responde
    if (hilo[0].autor_id !== autorId) {
      const { rows: [remitente] } = await query(
        'SELECT nombre, apellido FROM usuarios WHERE id = $1', [autorId]
      );
      const notifService = require('../services/notificaciones.service');
      await notifService.crear({
        usuarioId: hilo[0].autor_id,
        tipo:      'mensaje_foro',
        titulo:    `💬 Nueva respuesta en tu hilo`,
        mensaje:   `${remitente.nombre} ${remitente.apellido} respondió en "${hilo[0].titulo}".`,
        link:      `/abogado/foro/hilo/${hiloId}`,
      });
    }

    res.status(201).json({
      mensaje: 'Respuesta publicada.',
      respuesta,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/foro/hilos/:id (admin o autor)
// Eliminar un hilo propio o cualquiera si es admin
// verificarToken explícito como refuerzo al router.use global
// ─────────────────────────────────────────────────────────────
router.delete('/hilos/:id', verificarToken, async (req, res, next) => {
  try {
    const { rows: hilo } = await query(
      'SELECT autor_id FROM foro_hilos WHERE id = $1',
      [req.params.id]
    );

    if (hilo.length === 0) {
      return res.status(404).json({ error: 'Hilo no encontrado.' });
    }

    // Solo el autor o el admin pueden eliminarlo
    const esAutor = hilo[0].autor_id === req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!esAutor && !esAdmin) {
      return res.status(403).json({ error: 'No tenés permiso para eliminar este hilo.' });
    }

    await query('DELETE FROM foro_hilos WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Hilo eliminado.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/foro/respuestas/:id (admin o autor)
// Eliminar una respuesta propia o cualquiera si es admin
// verificarToken explícito como refuerzo al router.use global
// ─────────────────────────────────────────────────────────────
router.delete('/respuestas/:id', verificarToken, async (req, res, next) => {
  try {
    const { rows: resp } = await query(
      'SELECT autor_id FROM foro_respuestas WHERE id = $1',
      [req.params.id]
    );

    if (resp.length === 0) {
      return res.status(404).json({ error: 'Respuesta no encontrada.' });
    }

    const esAutor = resp[0].autor_id === req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!esAutor && !esAdmin) {
      return res.status(403).json({ error: 'No tenés permiso para eliminar esta respuesta.' });
    }

    await query('DELETE FROM foro_respuestas WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Respuesta eliminada.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/foro/hilos/:id/fijar (solo admin)
// Fijar o desfijar un hilo
// ─────────────────────────────────────────────────────────────
router.patch('/hilos/:id/fijar',    verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { fijado } = req.body;
    await query(
      'UPDATE foro_hilos SET fijado = $1 WHERE id = $2',
      [fijado, req.params.id]
    );
    res.json({ mensaje: `Hilo ${fijado ? 'fijado' : 'desfijado'}.` });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/foro/hilos/:id/editar (solo admin)
// Editar título y/o contenido de un hilo
// Casos de uso: remover info sensible, corregir datos erróneos
// ─────────────────────────────────────────────────────────────
router.patch('/hilos/:id/editar',   verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { titulo, contenido } = req.body;

    if (!titulo?.trim() && !contenido?.trim()) {
      return res.status(400).json({ error: 'Debés enviar al menos título o contenido para editar.' });
    }

    const { rows: [hilo] } = await query(
      `UPDATE foro_hilos SET
         titulo         = COALESCE($1, titulo),
         contenido      = COALESCE($2, contenido),
         editado_en     = NOW(),
         editado_por_id = $3
       WHERE id = $4
       RETURNING id, titulo, contenido, editado_en`,
      [
        titulo?.trim()   || null,
        contenido?.trim() || null,
        req.usuario.id,
        req.params.id,
      ]
    );

    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });

    res.json({ mensaje: 'Hilo editado.', hilo });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/foro/respuestas/:id/editar (solo admin)
// Editar el contenido de una respuesta
// Casos de uso: remover info sensible, lenguaje inapropiado
// ─────────────────────────────────────────────────────────────
router.patch('/respuestas/:id/editar', verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { contenido } = req.body;

    if (!contenido?.trim()) {
      return res.status(400).json({ error: 'El contenido es obligatorio.' });
    }

    const { rows: [respuesta] } = await query(
      `UPDATE foro_respuestas SET
         contenido      = $1,
         editado_en     = NOW(),
         editado_por_id = $2
       WHERE id = $3
       RETURNING id, contenido, editado_en`,
      [contenido.trim(), req.usuario.id, req.params.id]
    );

    if (!respuesta) return res.status(404).json({ error: 'Respuesta no encontrada.' });

    res.json({ mensaje: 'Respuesta editada.', respuesta });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/foro/hilos/:id/mover (solo admin)
// Mover un hilo a otra categoría
// Casos de uso: hilo posteado en categoría incorrecta
// ─────────────────────────────────────────────────────────────
router.patch('/hilos/:id/mover',    verificarToken, requireRol('admin'), async (req, res, next) => {
  try {
    const { categoria_id } = req.body;

    if (!categoria_id) {
      return res.status(400).json({ error: 'La categoría destino es obligatoria.' });
    }

    // Verificar que la categoría destino existe
    const { rows: cat } = await query(
      'SELECT id, nombre FROM foro_categorias WHERE id = $1',
      [categoria_id]
    );

    if (cat.length === 0) {
      return res.status(404).json({ error: 'Categoría destino no encontrada.' });
    }

    const { rows: [hilo] } = await query(
      `UPDATE foro_hilos SET categoria_id = $1 WHERE id = $2
       RETURNING id, titulo, categoria_id`,
      [categoria_id, req.params.id]
    );

    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });

    res.json({
      mensaje: `Hilo movido a "${cat[0].nombre}".`,
      hilo,
    });
  } catch (error) { next(error); }
});

module.exports = router;
