// ============================================================
// src/config/database.js
// Conexión a PostgreSQL — compatible con Neon, Supabase y local
// ============================================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL activado para cualquier DB en la nube
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool
  .connect()
  .then((client) => {
    console.log('✅ Conexión con PostgreSQL establecida');
    client.release();
  })
  .catch((err) => {
    console.error('⚠️  Error de conexión:', err.message);
  });

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
