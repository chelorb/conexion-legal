// ============================================================
// src/config/database.js
// Conexión a PostgreSQL — soporta variables separadas o URL
// Compatible con Supabase (pooler) y PostgreSQL local
// ============================================================

const { Pool } = require('pg');

// Construir config según disponibilidad de variables
// Prioridad: variables separadas > DATABASE_URL
let config;

if (process.env.DB_HOST) {
  // Variables separadas — más confiable con Supabase en Render
  config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log(`🔌 Conectando a: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
} else {
  // Fallback a DATABASE_URL (para desarrollo local)
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log(`🔌 Conectando via URL`);
}

const pool = new Pool(config);

// Verificar conexión al iniciar
pool
  .connect()
  .then((client) => {
    console.log('✅ Conexión con PostgreSQL establecida correctamente');
    client.release();
  })
  .catch((err) => {
    console.error('⚠️  Error de conexión inicial:', err.message);
  });

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
