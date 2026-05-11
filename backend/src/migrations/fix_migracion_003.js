// ============================================================
// fix_migracion_003.js
// Limpia el estado de la migración 003 para poder re-ejecutarla
// Uso: node src/migrations/fix_migracion_003.js
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function fix() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Borrar el registro de la migración fallida
    const { rowCount } = await client.query(
      "DELETE FROM migraciones_ejecutadas WHERE archivo = '003_planes_basico_comunidad.sql'"
    );
    console.log(rowCount > 0
      ? '✅ Registro de migración 003 eliminado'
      : 'ℹ️  La migración 003 no estaba registrada'
    );

    // 2. Verificar el estado actual de los planes
    const { rows: planes } = await client.query('SELECT id, nombre, slug FROM planes_suscripcion');
    console.log(`\nPlanes actuales en la DB (${planes.length}):`);
    planes.forEach(p => console.log(`   - ${p.nombre} (${p.slug})`));

    // 3. Mostrar cuántos abogados hay con plan asignado
    const { rows: [conteo] } = await client.query(
      'SELECT COUNT(*) AS total FROM perfiles_abogado WHERE plan_id IS NOT NULL'
    );
    console.log(`\nAbogados con plan asignado: ${conteo.total}`);

    await client.query('COMMIT');
    console.log('\n✅ Fix completado. Ahora corré: npm run migrate');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
