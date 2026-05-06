// ============================================================
// src/routes/admin.routes.js
// ============================================================
const expressA = require('express');
const routerA  = expressA.Router();
const { query: aQuery } = require('../config/database');
const { verificarToken, requireRol } = require('../middleware/auth.middleware');

// Todos los endpoints de admin requieren autenticación y rol admin
routerA.use(verificarToken, requireRol('admin'));

// Listar todos los usuarios
routerA.get('/usuarios', async (req, res, next) => {
  try {
    const { rows } = await aQuery(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.activo,
              u.email_verificado, u.creado_en, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       ORDER BY u.creado_en DESC
       LIMIT 100`
    );
    res.json({ usuarios: rows });
  } catch (error) { next(error); }
});

// Aprobar/rechazar perfil de abogado
routerA.patch('/abogados/:id/aprobar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visible, matricula_verificada } = req.body;

    await aQuery(
      `UPDATE perfiles_abogado SET
         visible_en_grilla    = COALESCE($1, visible_en_grilla),
         matricula_verificada = COALESCE($2, matricula_verificada)
       WHERE usuario_id = $3`,
      [visible, matricula_verificada, id]
    );

    res.json({ mensaje: 'Perfil de abogado actualizado.' });
  } catch (error) { next(error); }
});

// Habilitar/deshabilitar usuario
routerA.patch('/usuarios/:id/estado', async (req, res, next) => {
  try {
    const { activo } = req.body;
    await aQuery('UPDATE usuarios SET activo = $1 WHERE id = $2', [activo, req.params.id]);
    res.json({ mensaje: `Usuario ${activo ? 'habilitado' : 'deshabilitado'}.` });
  } catch (error) { next(error); }
});

// Estadísticas generales de la plataforma
routerA.get('/estadisticas', async (req, res, next) => {
  try {
    const [usuarios, abogados, consultas, pagos] = await Promise.all([
      aQuery("SELECT COUNT(*) AS total FROM usuarios WHERE activo = true"),
      aQuery("SELECT COUNT(*) AS total FROM perfiles_abogado WHERE visible_en_grilla = true"),
      aQuery("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado='completada') AS completadas FROM consultas"),
      aQuery("SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE mp_status = 'approved'"),
    ]);

    res.json({
      usuarios_activos:    parseInt(usuarios.rows[0].total),
      abogados_visibles:   parseInt(abogados.rows[0].total),
      consultas_totales:   parseInt(consultas.rows[0].total),
      consultas_completadas: parseInt(consultas.rows[0].completadas),
      ingresos_totales:    parseFloat(pagos.rows[0].total),
    });
  } catch (error) { next(error); }
});

module.exports = routerA;
