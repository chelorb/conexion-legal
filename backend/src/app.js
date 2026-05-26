// ============================================================
// src/app.js — Punto de entrada de la API REST
// Configura Express con todos sus middlewares y rutas
// ============================================================

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

// Validar conexión a la base de datos al iniciar
require('./config/database');

// Importar todas las rutas
const authRoutes           = require('./routes/auth.routes');
const usuariosRoutes       = require('./routes/usuarios.routes');
const abogadosRoutes       = require('./routes/abogados.routes');
const consultasRoutes      = require('./routes/consultas.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const campusRoutes         = require('./routes/campus.routes');
const agendaRoutes         = require('./routes/agenda.routes');
const foroRoutes           = require('./routes/foro.routes');       // ← FORO
const pagosRoutes          = require('./routes/pagos.routes');
const beneficiosRoutes     = require('./routes/beneficios.routes');
const adminRoutes          = require('./routes/admin.routes');
const planesAdminRoutes    = require('./routes/planes.admin.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');

const app = express();

// ── Seguridad ─────────────────────────────────────────────────
app.use(helmet());

// CORS: acepta requests del frontend en producción y en local
const origenesPermitidos = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean); // Elimina valores undefined

app.use(cors({
  origin:      origenesPermitidos,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting global
const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { error: 'Demasiadas solicitudes. Intentá de nuevo en 15 minutos.' },
});

// Rate limiting estricto para auth
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Demasiados intentos. Esperá 15 minutos.' },
});

app.use(limiterGlobal);

// ── Middlewares generales ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ─────────────────────────────────────────────
// Render usa este endpoint para verificar que el servidor está vivo
app.get('/health', (req, res) => {
  res.status(200).json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api/auth',           limiterAuth, authRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/abogados',       abogadosRoutes);
app.use('/api/consultas',      consultasRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/campus',         campusRoutes);
app.use('/api/agenda',         agendaRoutes);
app.use('/api/foro',           foroRoutes);          // ← FORO
app.use('/api/pagos',          pagosRoutes);
app.use('/api/beneficios',     beneficiosRoutes);
app.use('/api/admin',                adminRoutes);
app.use('/api/admin/planes-gestion', planesAdminRoutes);
// Ruta pública para links de interés (sin auth, visible en el dashboard)
const { linksPublicos } = require('./routes/admin.routes');
app.get('/api/links', linksPublicos);
app.use('/api/notificaciones', notificacionesRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

// ── Error handler global ─────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  } else {
    console.error(`[${new Date().toISOString()}]`, err.message);
  }

  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Token inválido.' });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Sesión expirada.' });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

// ── Iniciar servidor ─────────────────────────────────────────
// Render requiere que el servidor escuche en 0.0.0.0 (todas las interfaces)
// El puerto lo asigna Render automáticamente via la variable PORT
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces, no solo localhost

app.listen(PORT, HOST, () => {
  console.log(`\n⚖️  Conexión Legal API — puerto ${PORT}`);
  console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Servidor listo en ${HOST}:${PORT}\n`);
});

module.exports = app;
