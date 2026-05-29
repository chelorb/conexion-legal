// ============================================================
// src/migrations/run.js — Ejecuta las migraciones SQL en orden
// Uso: npm run migrate
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Crear tabla de control de migraciones si no existe
    // Esta tabla registra qué migraciones ya se ejecutaron
    await client.query(`
      CREATE TABLE IF NOT EXISTS migraciones_ejecutadas (
        id          SERIAL PRIMARY KEY,
        archivo     VARCHAR(255) UNIQUE NOT NULL,
        ejecutado_en TIMESTAMP DEFAULT NOW()
      )
    `);

    // Leer todos los archivos .sql de la carpeta de migraciones, en orden
    const migrationsDir = path.join(__dirname);
    const archivos = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Orden numérico: 001_, 002_, 003_, ...

    for (const archivo of archivos) {
      // Verificar si esta migración ya fue ejecutada
      const { rows } = await client.query(
        'SELECT id FROM migraciones_ejecutadas WHERE archivo = $1',
        [archivo]
      );

      if (rows.length > 0) {
        console.log(`⏭️  Ya ejecutada: ${archivo}`);
        continue;
      }

      // Leer y ejecutar el SQL
      console.log(`🔄 Ejecutando: ${archivo}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, archivo), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        // Registrar que esta migración fue ejecutada
        await client.query(
          'INSERT INTO migraciones_ejecutadas (archivo) VALUES ($1)',
          [archivo]
        );
        await client.query('COMMIT');
        console.log(`✅ Completada: ${archivo}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Error en migración ${archivo}: ${err.message}`);
      }
    }

    console.log('\n🎉 Todas las migraciones completadas exitosamente');
  } catch (err) {
    console.error('\n❌ Error en migraciones:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
