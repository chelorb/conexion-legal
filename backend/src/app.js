// ============================================================
// src/app.js — Punto de entrada de la API REST
// Configura Express con todos sus middlewares y rutas
// ============================================================

require('dotenv').config(); // Cargar variables de entorno desde .env

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const path    = require('path');

// Importar la conexión a la base de datos (valida al iniciar)
require('./config/database');

// Importar todas las rutas de la API
const authRoutes         = require('./routes/auth.routes');
const usuariosRoutes     = require('./routes/usuarios.routes');
const abogadosRoutes     = require('./routes/abogados.routes');
const consultasRoutes    = require('./routes/consultas.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const campusRoutes       = require('./routes/campus.routes');
const pagosRoutes        = require('./routes/pagos.routes');
const beneficiosRoutes   = require('./routes/beneficios.routes');
const adminRoutes        = require('./routes/admin.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');

const app = express();

// ─────────────────────────────────────────────────────────────
// MIDDLEWARES DE SEGURIDAD
// ─────────────────────────────────────────────────────────────

// Helmet: agrega headers HTTP de seguridad automáticamente
app.use(helmet());

// CORS: solo permite requests desde el dominio del frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Permite enviar cookies/headers de auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting: limita requests para prevenir ataques de fuerza bruta
// Límite global: 100 requests por IP cada 15 minutos
const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas solicitudes. Por favor intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite estricto para autenticación: previene ataques de fuerza bruta
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Solo 10 intentos de login/registro cada 15 min
  message: { error: 'Demasiados intentos de autenticación. Esperá 15 minutos.' },
});

app.use(limiterGlobal);


// ─────────────────────────────────────────────────────────────
// MIDDLEWARES GENERALES
// ─────────────────────────────────────────────────────────────

// Morgan: logs de requests HTTP (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parsear JSON en el body de las requests (máx 10mb para uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos subidos (fotos de perfil, documentos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ─────────────────────────────────────────────────────────────
// HEALTH CHECK — Para monitoring y Railway
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
  });
});


// ─────────────────────────────────────────────────────────────
// RUTAS DE LA API
// Todas las rutas tienen prefijo /api
// ─────────────────────────────────────────────────────────────
app.use('/api/auth',           limiterAuth, authRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/abogados',       abogadosRoutes);
app.use('/api/consultas',      consultasRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/campus',         campusRoutes);
app.use('/api/pagos',          pagosRoutes);
app.use('/api/beneficios',     beneficiosRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/notificaciones', notificacionesRoutes);


// ─────────────────────────────────────────────────────────────
// MANEJO DE ERRORES
// ─────────────────────────────────────────────────────────────

// 404 — Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Error handler global — captura todos los errores no controlados
// Recibe 4 parámetros para que Express lo reconozca como error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log completo solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  } else {
    // En producción solo loguear lo esencial
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
  }

  // No filtrar errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado. Por favor iniciá sesión nuevamente.' });
  }

  // Error genérico — no exponer detalles en producción
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});


// ─────────────────────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n⚖️  Conexión Legal API corriendo en puerto ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app; // Para tests con Jest
