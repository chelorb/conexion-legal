// ============================================================
// backend/src/migrations/seed.js
// Datos de prueba para desarrollo local
// Uso: npm run seed
// ¡NO ejecutar en producción!
// ============================================================

require('dotenv').config();
const bcrypt  = require('bcryptjs');
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

    // ── 1. Obtener IDs de roles y planes ──────────────────────
    const { rows: roles } = await client.query('SELECT id, nombre FROM roles');
    const rolMap = Object.fromEntries(roles.map(r => [r.nombre, r.id]));

    const { rows: planes } = await client.query('SELECT id, slug FROM planes_suscripcion');
    const planMap = Object.fromEntries(planes.map(p => [p.slug, p.id]));

    // ── 2. Crear usuario administrador ────────────────────────
    const adminHash = await bcrypt.hash('Admin1234', 12);
    const { rows: [admin] } = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
       VALUES ('Admin', 'Sistema', 'admin@conexionlegal.com', $1, $2, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      [adminHash, rolMap.admin]
    );
    if (admin) console.log(`✅ Admin creado: ${admin.email} / contraseña: Admin1234`);

    // ── 3. Crear abogados de prueba ───────────────────────────
    const abogados = [
      {
        nombre: 'María', apellido: 'González', email: 'maria@test.com',
        especialidades: ['Derecho Civil', 'Derecho de Familia'],
        ciudad: 'Buenos Aires', provincia: 'Buenos Aires',
        descripcion: 'Abogada especializada en derecho de familia y civil con 12 años de experiencia. Atiendo tanto casos de divorcio como sucesiones y contratos.',
        anos_experiencia: 12, plan: 'premium',
        calificacion: 4.8, total_cal: 34,
      },
      {
        nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@test.com',
        especialidades: ['Derecho Laboral', 'Derecho Comercial'],
        ciudad: 'Córdoba', provincia: 'Córdoba',
        descripcion: 'Especialista en conflictos laborales y derecho comercial. Más de 8 años representando empleados y empleadores.',
        anos_experiencia: 8, plan: 'basico',
        calificacion: 4.5, total_cal: 21,
      },
      {
        nombre: 'Laura', apellido: 'Martínez', email: 'laura@test.com',
        especialidades: ['Derecho Penal', 'Mediación'],
        ciudad: 'Rosario', provincia: 'Santa Fe',
        descripcion: 'Penalista con amplia trayectoria en defensa penal. También ofrezco servicios de mediación y resolución alternativa de conflictos.',
        anos_experiencia: 15, plan: 'premium',
        calificacion: 4.9, total_cal: 58,
      },
      {
        nombre: 'Pablo', apellido: 'Fernández', email: 'pablo@test.com',
        especialidades: ['Derecho Inmobiliario', 'Derecho Civil'],
        ciudad: 'Mendoza', provincia: 'Mendoza',
        descripcion: 'Asesoramiento en compraventa de inmuebles, contratos de alquiler y disputas de propiedad.',
        anos_experiencia: 5, plan: 'gratuito',
        calificacion: 4.2, total_cal: 8,
      },
    ];

    for (const a of abogados) {
      const hash = await bcrypt.hash('Password1', 12);

      const { rows: [usuario] } = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [a.nombre, a.apellido, a.email, hash, rolMap.abogado]
      );

      if (!usuario) {
        console.log(`⏭️  Abogado ya existe: ${a.email}`);
        continue;
      }

      // Calcular fechas de suscripción
      const inicio = new Date();
      const fin    = new Date();
      fin.setMonth(fin.getMonth() + 1);

      await client.query(
        `INSERT INTO perfiles_abogado (
           usuario_id, especialidades, descripcion, anos_experiencia,
           ciudad, provincia, plan_id, suscripcion_activa,
           suscripcion_inicio, suscripcion_fin,
           atiende_online, atiende_presencial,
           matricula, matricula_verificada,
           calificacion_promedio, total_calificaciones,
           perfil_completo, visible_en_grilla
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,true,true,
                   'T-' || floor(random()*9999+1000)::text, true,
                   $10,$11,true,true)`,
        [
          usuario.id, a.especialidades, a.descripcion, a.anos_experiencia,
          a.ciudad, a.provincia, planMap[a.plan],
          inicio, fin,
          a.calificacion, a.total_cal,
        ]
      );

      console.log(`✅ Abogado creado: ${a.email} (Plan: ${a.plan}) / contraseña: Password1`);
    }

    // ── 4. Crear clientes de prueba ───────────────────────────
    const clientes = [
      { nombre: 'Ana', apellido: 'López',   email: 'ana@test.com' },
      { nombre: 'Juan', apellido: 'Pérez',  email: 'juan@test.com' },
    ];

    for (const c of clientes) {
      const hash = await bcrypt.hash('Password1', 12);
      const { rows: [u] } = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, email_verificado)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [c.nombre, c.apellido, c.email, hash, rolMap.cliente]
      );
      if (u) console.log(`✅ Cliente creado: ${c.email} / contraseña: Password1`);
    }

    // ── 5. Contenido de campus de prueba ──────────────────────
    const campus = [
      {
        tipo: 'curso', titulo: 'Introducción al Derecho Digital',
        descripcion: 'Curso introductorio sobre regulación de tecnología, datos personales y comercio electrónico.',
        autor: 'Dr. Roberto Silva', especialidad: 'Derecho Comercial',
        duracion_min: 180, plan_requerido: 'basico',
      },
      {
        tipo: 'podcast', titulo: 'Jurisprudencia al día — Episodio 12',
        descripcion: 'Análisis de los fallos más relevantes de la Corte Suprema en el último trimestre.',
        autor: 'Dra. Claudia Ramos', especialidad: 'Derecho Civil',
        duracion_min: 45, plan_requerido: 'basico',
      },
      {
        tipo: 'videoconferencia', titulo: 'Congreso: Reforma Procesal 2025',
        descripcion: 'Panel de expertos sobre los cambios en el Código Procesal Civil y sus implicancias prácticas.',
        autor: 'Colegio de Abogados', especialidad: 'Derecho Civil',
        duracion_min: 120, plan_requerido: 'premium',
        es_evento: true, fecha_evento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // en 7 días
      },
    ];

    for (const c of campus) {
      await client.query(
        `INSERT INTO contenido_campus
           (tipo, titulo, descripcion, autor, especialidad, duracion_min, plan_requerido, es_evento, fecha_evento)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [c.tipo, c.titulo, c.descripcion, c.autor, c.especialidad,
         c.duracion_min, c.plan_requerido, c.es_evento || false, c.fecha_evento || null]
      );
    }
    console.log(`✅ ${campus.length} contenidos de campus creados`);

    // ── 6. Beneficios de prueba ───────────────────────────────
    const beneficios = [
      {
        nombre: 'Librería Jurídica El Foro',
        descripcion: '30% de descuento en todos los libros jurídicos',
        categoria: 'Librería', descuento_pct: 30,
        codigo_descuento: 'CXLEGAL30', plan_minimo: 'premium',
      },
      {
        nombre: 'Coworking LexSpace',
        descripcion: '1 día de coworking gratis por mes + 20% de descuento en membresías',
        categoria: 'Coworking', descuento_pct: 20,
        codigo_descuento: 'LEX20CO', plan_minimo: 'premium',
      },
      {
        nombre: 'Confitería El Palacio',
        descripcion: '15% de descuento en consumiciones',
        categoria: 'Gastronomía', descuento_pct: 15,
        codigo_descuento: 'LEGAL15', plan_minimo: 'basico',
      },
    ];

    for (const b of beneficios) {
      await client.query(
        `INSERT INTO beneficios (nombre, descripcion, categoria, descuento_pct, codigo_descuento, plan_minimo)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [b.nombre, b.descripcion, b.categoria, b.descuento_pct, b.codigo_descuento, b.plan_minimo]
      );
    }
    console.log(`✅ ${beneficios.length} beneficios creados`);

    await client.query('COMMIT');

    console.log('\n🎉 Datos de prueba cargados exitosamente');
    console.log('\n📋 Cuentas disponibles:');
    console.log('   👑 Admin:   admin@conexionlegal.com / Admin1234');
    console.log('   ⚖️  Abogado: maria@test.com / Password1 (Premium)');
    console.log('   ⚖️  Abogado: carlos@test.com / Password1 (Básico)');
    console.log('   👤 Cliente: ana@test.com / Password1');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error al cargar datos de prueba:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
