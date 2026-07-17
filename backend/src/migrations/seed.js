// ============================================================
// backend/src/migrations/seed.js
// Datos de prueba para desarrollo local
// Uso: npm run seed
// ¡NO ejecutar en producción!
// ============================================================

require('dotenv').config();
const bcrypt   = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Iniciando carga de datos de prueba...\n');

  try {
    await client.query('BEGIN');

    // ── Obtener IDs de roles y planes ────────────────────────
    const { rows: roles } = await client.query('SELECT id, nombre FROM roles');
    const rolMap = Object.fromEntries(roles.map(r => [r.nombre, r.id]));

    const { rows: planes } = await client.query('SELECT id, slug FROM planes_suscripcion');
    const planMap = Object.fromEntries(planes.map(p => [p.slug, p.id]));

    // ── Admin ─────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('Admin1234', 12);
    const { rows: [admin] } = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
       VALUES ('Admin', 'Sistema', 'admin@ejemplo.com', $1, $2, true)
       ON CONFLICT (email) DO NOTHING RETURNING id, email`,
      [adminHash, rolMap.admin]
    );
    if (admin) console.log(`✅ Admin: ${admin.email} / Admin1234`);

    // ── Abogados de prueba ────────────────────────────────────
    const abogados = [
      {
        nombre: 'María', apellido: 'González', email: 'maria@test.com',
        especialidades: ['Derecho Civil', 'Derecho de Familia'],
        ciudad: 'Buenos Aires', provincia: 'Buenos Aires',
        descripcion: 'Abogada especializada en derecho de familia y civil con 12 años de experiencia.',
        anos_experiencia: 12, plan: 'comunidad',
        calificacion: 4.8, total_cal: 34,
      },
      {
        nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@test.com',
        especialidades: ['Derecho Laboral', 'Derecho Comercial'],
        ciudad: 'Córdoba', provincia: 'Córdoba',
        descripcion: 'Especialista en conflictos laborales y derecho comercial.',
        anos_experiencia: 8, plan: 'basico',
        calificacion: 4.5, total_cal: 21,
      },
      {
        nombre: 'Laura', apellido: 'Martínez', email: 'laura@test.com',
        especialidades: ['Derecho Penal', 'Mediación'],
        ciudad: 'Rosario', provincia: 'Santa Fe',
        descripcion: 'Penalista con amplia trayectoria en defensa penal.',
        anos_experiencia: 15, plan: 'comunidad',
        calificacion: 4.9, total_cal: 58,
      },
    ];

    for (const a of abogados) {
      const hash = await bcrypt.hash('Password1', 12);
      const { rows: [u] } = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO NOTHING RETURNING id`,
        [a.nombre, a.apellido, a.email, hash, rolMap.abogado]
      );
      if (!u) { console.log(`⏭️  Ya existe: ${a.email}`); continue; }

      const fin = new Date();
      fin.setMonth(fin.getMonth() + 1);

      await client.query(
        `INSERT INTO perfiles_abogado (
           usuario_id, especialidades, descripcion, anos_experiencia,
           ciudad, provincia, plan_id, suscripcion_activa, suscripcion_fin,
           atiende_online, atiende_presencial,
           matricula, matricula_verificada,
           calificacion_promedio, total_calificaciones,
           perfil_completo, visible_en_grilla, estado_aprobacion
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,true,true,
                   'T-'||floor(random()*9999+1000)::text,true,
                   $9,$10,true,true,'aprobado')`,
        [u.id, a.especialidades, a.descripcion, a.anos_experiencia,
         a.ciudad, a.provincia, planMap[a.plan], fin,
         a.calificacion, a.total_cal]
      );
      console.log(`✅ Abogado: ${a.email} (${a.plan}) / Password1`);
    }

    // ── Cliente de prueba ─────────────────────────────────────
    const cliHash = await bcrypt.hash('Password1', 12);
    const { rows: [cli] } = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
       VALUES ('Ana', 'López', 'ana@test.com', $1, $2, true)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [cliHash, rolMap.cliente]
    );
    if (cli) console.log(`✅ Cliente: ana@test.com / Password1`);

    // ── Contenido del campus ──────────────────────────────────
    const campus = [
      {
        tipo: 'curso',
        titulo: 'Introducción al Derecho Digital',
        descripcion: 'Regulación de tecnología, datos personales y comercio electrónico.',
        autor: 'Dr. Roberto Silva', especialidad: 'Derecho Comercial',
        duracion_min: 180, plan_requerido: 'comunidad',
        es_evento: false,
      },
      {
        tipo: 'podcast',
        titulo: 'Jurisprudencia al día — Ep. 12',
        descripcion: 'Análisis de fallos relevantes de la Corte Suprema.',
        autor: 'Dra. Claudia Ramos', especialidad: 'Derecho Civil',
        duracion_min: 45, plan_requerido: 'comunidad',
        es_evento: false,
      },
      {
        tipo: 'videoconferencia',
        titulo: 'Seminario: Reforma Procesal 2025',
        descripcion: 'Panel de expertos sobre cambios en el Código Procesal Civil.',
        autor: 'Colegio de Abogados', especialidad: 'Derecho Civil',
        duracion_min: 120, plan_requerido: 'comunidad',
        es_evento: true,
        fecha_evento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        link_evento: 'https://meet.google.com/ejemplo',
        cupos_max: 50,
      },
      {
        tipo: 'congreso',
        titulo: 'Charla: Marketing Digital para Abogados',
        descripcion: 'Cómo construir tu marca personal y conseguir más clientes online.',
        autor: 'Lic. Martín Pérez', especialidad: null,
        duracion_min: 90, plan_requerido: 'comunidad',
        es_evento: true,
        fecha_evento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        link_evento: 'https://zoom.us/ejemplo',
        cupos_max: 100,
      },
      {
        tipo: 'biblioteca',
        titulo: 'Manual de Derecho Procesal Civil — 3ra Edición',
        descripcion: 'Texto completo en PDF para descarga.',
        autor: 'Dr. Carlos Falcón', especialidad: 'Derecho Civil',
        duracion_min: null, plan_requerido: 'comunidad',
        es_evento: false,
      },
    ];

    for (const c of campus) {
      await client.query(
        `INSERT INTO contenido_campus
           (tipo, titulo, descripcion, autor, especialidad, duracion_min,
            plan_requerido, es_evento, fecha_evento, link_evento, cupos_max)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [c.tipo, c.titulo, c.descripcion, c.autor, c.especialidad,
         c.duracion_min, c.plan_requerido, c.es_evento || false,
         c.fecha_evento || null, c.link_evento || null, c.cupos_max || null]
      );
    }
    console.log(`✅ ${campus.length} contenidos del campus`);

    // ── Beneficios ────────────────────────────────────────────
    const beneficios = [
      { nombre: 'Librería Jurídica El Foro', descripcion: '30% en libros jurídicos',
        categoria: 'Librería', descuento_pct: 30, codigo_descuento: 'CXLEGAL30', plan_minimo: 'comunidad' },
      { nombre: 'Coworking LexSpace', descripcion: '1 día gratis/mes + 20% en membresías',
        categoria: 'Coworking', descuento_pct: 20, codigo_descuento: 'LEX20CO', plan_minimo: 'comunidad' },
      { nombre: 'Confitería El Palacio', descripcion: '15% en consumiciones',
        categoria: 'Gastronomía', descuento_pct: 15, codigo_descuento: 'LEGAL15', plan_minimo: 'basico' },
    ];
    for (const b of beneficios) {
      await client.query(
        `INSERT INTO beneficios (nombre, descripcion, categoria, descuento_pct, codigo_descuento, plan_minimo)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [b.nombre, b.descripcion, b.categoria, b.descuento_pct, b.codigo_descuento, b.plan_minimo]
      );
    }
    console.log(`✅ ${beneficios.length} beneficios`);

    await client.query('COMMIT');

    console.log('\n🎉 Datos de prueba listos');
    console.log('\n📋 Cuentas:');
    console.log('   👑 Admin:     admin@ejemplo.com / [contraseña configurada en Neon]');
    console.log('   ⚖️  Comunidad: maria@test.com / Password1');
    console.log('   ⚖️  Básico:    carlos@test.com / Password1');
    console.log('   👤 Cliente:   ana@test.com / Password1');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
