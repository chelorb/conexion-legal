// ============================================================
// src/config/database.js — Configuración del pool de conexiones
// Usa un pool para reutilizar conexiones y mejorar el rendimiento
// Compatible con conexiones locales y Supabase (IPv4 + SSL)
// ============================================================

const { Pool } = require('pg');

// Detectar si estamos conectando a Supabase para activar SSL
const usarSSL = process.env.DATABASE_URL?.includes('supabase');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // SSL: activado para Supabase, desactivado para PostgreSQL local
  ssl: usarSSL ? { rejectUnauthorized: false } : false,

  // Configuración del pool de conexiones
  max:                    10,    // Máximo de conexiones simultáneas
  idleTimeoutMillis:      30000, // Cerrar conexiones inactivas a los 30 segundos
  connectionTimeoutMillis: 5000, // Timeout de 5 segundos para obtener conexión
});

// Verificar conexión al iniciar — sin detener el servidor si falla
// En producción puede tardar unos segundos en conectarse
pool.connect((err, client, release) => {
  if (err) {
    // Solo loguear el error, no detener el servidor
    console.error('⚠️  Advertencia: No se pudo conectar con PostgreSQL al iniciar:', err.message);
    console.error('   El servidor seguirá corriendo e intentará conectarse en cada query.');
  } else {
    console.log('✅ Conexión con PostgreSQL establecida correctamente');
    release(); // Liberar el cliente de vuelta al pool
  }
});

/**
 * Ejecuta una query SQL con parámetros
 * Los parámetros previenen SQL injection automáticamente
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtiene un cliente del pool para transacciones
 * Recordá siempre hacer client.release() al terminar
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
