// ============================================================
// src/app.js — API REST + Socket.io
// ============================================================

require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const path          = require('path');
const http          = require('http');
const { Server }    = require('socket.io');
const jwt           = require('jsonwebtoken');

require('./config/database');

// ── Rutas ─────────────────────────────────────────────────────
const authRoutes              = require('./routes/auth.routes');
const usuariosRoutes          = require('./routes/usuarios.routes');
const abogadosRoutes          = require('./routes/abogados.routes');
const consultasRoutes         = require('./routes/consultas.routes');
const calificacionesRoutes    = require('./routes/calificaciones.routes');
const campusRoutes            = require('./routes/campus.routes');
const agendaRoutes            = require('./routes/agenda.routes');
const foroRoutes              = require('./routes/foro.routes');
const pagosRoutes             = require('./routes/pagos.routes');
const beneficiosRoutes        = require('./routes/beneficios.routes');
const notificacionesRoutes    = require('./routes/notificaciones.routes');
const adminRoutes             = require('./routes/admin.routes');
const planesAdminRoutes       = require('./routes/planes.admin.routes');
const disponibilidadRoutes    = require('./routes/disponibilidad.routes'); // ← Fix: faltaba registrar
const documentosRoutes        = require('./routes/documentos.routes');     // ← Fix: faltaba registrar

const app = express();

// ── Seguridad ─────────────────────────────────────────────────
app.use(helmet());
// Necesario para que express-rate-limit lea la IP real detrás de Render/Vercel
app.set('trust proxy', 1);

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

// ── Rate limiting ─────────────────────────────────────────────

// Límite global: 200 requests por IP cada 15 minutos
// Protege contra scrapers y ataques de fuerza bruta generales
const limiterGlobal = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos.',
  },
  skip: () => process.env.NODE_ENV === 'development',
});

// Nota: limiterLogin y limiterRegistro viven en auth.routes.js
// aplicados directamente sobre cada endpoint específico

app.use(limiterGlobal);

// ── Middlewares ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Rutas API ─────────────────────────────────────────────────
// El rate limiting se aplica como middleware específico solo en login y registro
// auth.routes maneja internamente cuáles rutas son cuáles
app.use('/api/auth',               authRoutes);
app.use('/api/usuarios',           usuariosRoutes);
app.use('/api/abogados',           abogadosRoutes);
app.use('/api/consultas',          consultasRoutes);
app.use('/api/calificaciones',     calificacionesRoutes);
app.use('/api/campus',             campusRoutes);
app.use('/api/agenda',             agendaRoutes);
app.use('/api/foro',               foroRoutes);
// app.use('/api/pagos', pagosRoutes); // ← DESHABILITADO — MercadoPago pendiente de activar
app.use('/api/beneficios',         beneficiosRoutes);
app.use('/api/notificaciones',     notificacionesRoutes);
app.use('/api/disponibilidad',     disponibilidadRoutes); // ← Fix: ahora registrada
app.use('/api/documentos',         documentosRoutes);     // ← Fix: ahora registrada
app.use('/api/admin',              adminRoutes);
app.use('/api/admin/planes-gestion', planesAdminRoutes);

// Ruta pública de config (botón WhatsApp)
app.get('/api/config/publica', async (req, res, next) => {
  try {
    const { query: dbQuery } = require('./config/database');
    const { rows } = await dbQuery(
      "SELECT clave, valor FROM config_plataforma WHERE clave IN ('whatsapp_admin')"
    );
    const config = rows.reduce((acc, r) => { acc[r.clave] = r.valor; return acc; }, {});
    res.json({ config });
  } catch (error) { next(error); }
});

// Ruta pública de links de interés (sin auth)
const adminRoutesModule = require('./routes/admin.routes');
app.get('/api/links', adminRoutesModule.linksPublicos || (async (req, res, next) => {
  try {
    const { query: dbQuery } = require('./config/database');
    const { rows } = await dbQuery(
      'SELECT id, titulo, url, descripcion FROM links_interes WHERE activo = true ORDER BY orden ASC'
    );
    res.json({ links: rows });
  } catch (error) { next(error); }
}));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl })
);

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[${new Date().toISOString()}]`, err.message);
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Token inválido.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sesión expirada.' });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
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
  transports: ['polling', 'websocket'],
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuarioId = payload.id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.usuarioId;
  socket.join(`user_${uid}`);
  console.log(`🔌 Socket conectado: user_${uid}`);
  socket.on('disconnect', () => console.log(`🔌 Desconectado: user_${uid}`));
});

const notifService = require('./services/notificaciones.service');
notifService.setIO(io);

// ── Arrancar ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`\n⚖️  IUSTIXIUM API — ${HOST}:${PORT}`);
  console.log(`🔌 Socket.io listo`);
  console.log(`🛡️  Rate limiting: ${process.env.NODE_ENV === 'development' ? 'DESACTIVADO (dev)' : 'ACTIVO'}`);
  console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
