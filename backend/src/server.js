// ============================================================
// src/server.js
// Servidor HTTP + Socket.io para notificaciones en tiempo real
// ============================================================

const http    = require('http');
const { Server } = require('socket.io');
const jwt     = require('jsonwebtoken');
const app     = require('./app');
const notifService = require('./services/notificaciones.service');

const PORT    = process.env.PORT || 3001;

// ── Crear servidor HTTP sobre Express ─────────────────────────
const server = http.createServer(app);

// ── Configurar Socket.io ──────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware de autenticación en WebSocket
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
  // Cada usuario entra a su sala personal
  socket.join(`user_${uid}`);
  console.log(`🔌 Socket conectado: user_${uid}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado: user_${uid}`);
  });
});

// Inyectar io en el servicio de notificaciones
notifService.setIO(io);

// ── Arrancar ──────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔌 Socket.io habilitado`);
});

module.exports = { server, io };
