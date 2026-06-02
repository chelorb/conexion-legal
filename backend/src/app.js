// ============================================================
// src/app.js
// Entry point del servidor: Express + Socket.io + rutas
// ============================================================

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

// Inicializar conexión a la base de datos
require('./config/database');

// ── Importar rutas ────────────────────────────────────────────
const authRoutes           = require('./routes/auth.routes');
const usuariosRoutes       = require('./routes/usuarios.routes');
const abogadosRoutes       = require('./routes/abogados.routes');
const consultasRoutes      = require('./routes/consultas.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const campusRoutes         = require('./routes/campus.routes');
const agendaRoutes         = require('./routes/agenda.routes');
const foroRoutes           = require('./routes/foro.routes');
const pagosRoutes          = require('./routes/pagos.routes');
const beneficiosRoutes     = require('./routes/beneficios.routes');
const notificacionesRoutes  = require('./routes/notificaciones.routes');
const disponibilidadRoutes  = require('./routes/disponibilidad.routes');
const adminRoutes          = require('./routes/admin.routes');
const planesAdminRoutes    = require('./routes/planes.admin.routes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const origenesPermitidos = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin:         origenesPermitidos,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Seguridad y logging ───────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1); // Necesario para Render/proxies inversos

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Parseo de body ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Archivos estáticos (uploads) ──────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas API ─────────────────────────────────────────────────
app.use('/api/auth',                 authRoutes);
app.use('/api/usuarios',             usuariosRoutes);
app.use('/api/abogados',             abogadosRoutes);
app.use('/api/consultas',            consultasRoutes);
app.use('/api/calificaciones',       calificacionesRoutes);
app.use('/api/campus',               campusRoutes);
app.use('/api/agenda',               agendaRoutes);
app.use('/api/foro',                 foroRoutes);
app.use('/api/pagos',                pagosRoutes);
app.use('/api/beneficios',           beneficiosRoutes);
app.use('/api/notificaciones',       notificacionesRoutes);
app.use('/api/disponibilidad',       disponibilidadRoutes);
app.use('/api/admin',                adminRoutes);
app.use('/api/admin/planes-gestion', planesAdminRoutes);

// Ruta pública de links de interés (sin autenticación, para el sidebar del abogado)
app.get('/api/links', adminRoutes.linksPublicos);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[ERROR ${new Date().toISOString()}]`, err.message);
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Token inválido.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sesión expirada. Iniciá sesión nuevamente.' });
  if (err.code === '23505')             return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

// ── Socket.io ─────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:      origenesPermitidos,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  // polling como fallback para entornos que no soportan WebSocket puro
  transports: ['polling', 'websocket'],
});

// Autenticar conexiones de WebSocket con el JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido para conectar al socket'));
  try {
    const payload    = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuarioId = payload.id;
    next();
  } catch {
    next(new Error('Token inválido o expirado'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.usuarioId;
  // Cada usuario entra a su sala personal → solo él recibe sus notificaciones
  socket.join(`user_${uid}`);
  console.log(`🔌 Socket conectado: user_${uid}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado: user_${uid}`);
  });
});

// Inyectar la instancia de io en el servicio de notificaciones
const notifService = require('./services/notificaciones.service');
notifService.setIO(io);

// ── Iniciar servidor ──────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Render requiere escuchar en todas las interfaces

server.listen(PORT, HOST, () => {
  console.log(`\n⚖️  Conexión Legal API — ${HOST}:${PORT}`);
  console.log(`🔌 Socket.io habilitado (polling + websocket)`);
  console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
