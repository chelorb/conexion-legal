// ============================================================
// src/config/database.js — Configuración del pool de conexiones PostgreSQL
// Usa un pool para reutilizar conexiones y mejorar el rendimiento
// ============================================================

const { Pool } = require('pg');

// Pool de conexiones: mantiene múltiples conexiones abiertas
// y las reutiliza en lugar de abrir una nueva por cada consulta
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Configuración del pool
  max: 20,              // Máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,   // Cierra conexiones inactivas a los 30 segundos
  connectionTimeoutMillis: 2000, // Error si no se puede conectar en 2 segundos

  // En producción con Railway/Heroku usar SSL
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Verificar conexión al iniciar la aplicación
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    process.exit(1); // Detiene la app si no hay DB
  } else {
    console.log('✅ Conexión con PostgreSQL establecida correctamente');
    release(); // Libera el cliente de vuelta al pool
  }
});

/**
 * Función auxiliar para ejecutar queries con manejo de errores
 * @param {string} text - Query SQL
 * @param {Array} params - Parámetros de la query (evita SQL injection)
 * @returns {Promise<QueryResult>}
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Función para transacciones — útil cuando hay múltiples operaciones
 * que deben ejecutarse juntas o fallar juntas
 * @example
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT...');
 *   await client.query('UPDATE...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
