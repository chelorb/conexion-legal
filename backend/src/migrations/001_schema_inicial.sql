-- ============================================================
-- migrations/001_schema_inicial.sql
-- Esquema completo de la base de datos de Conexión Legal
-- Ejecutar en orden con: npm run migrate
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- EXTENSIONES
-- ─────────────────────────────────────────────────────────────

-- uuid-ossp: genera IDs únicos universales para cada registro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto: funciones criptográficas adicionales
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- TABLA: roles
-- Define los tipos de usuarios del sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'abogado', 'cliente'
  descripcion TEXT,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Insertar roles base del sistema
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',   'Administrador con acceso total a la plataforma'),
  ('abogado', 'Profesional del derecho que ofrece servicios'),
  ('cliente', 'Persona que busca asesoramiento legal')
ON CONFLICT (nombre) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TABLA: planes_suscripcion
-- Define los planes disponibles para abogados
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planes_suscripcion (
  id                      SERIAL PRIMARY KEY,
  nombre                  VARCHAR(100) NOT NULL,         -- 'Gratuito', 'Básico', 'Premium'
  slug                    VARCHAR(50) UNIQUE NOT NULL,   -- 'gratuito', 'basico', 'premium'
  precio_mensual          DECIMAL(10,2) DEFAULT 0,       -- Precio en ARS
  precio_anual            DECIMAL(10,2) DEFAULT 0,       -- Precio con descuento anual

  -- Funcionalidades del plan (booleanos para control de acceso)
  aparece_en_grilla       BOOLEAN DEFAULT true,          -- Visible en búsqueda de clientes
  max_consultas_mes       INTEGER DEFAULT 5,             -- NULL = ilimitado
  acceso_campus           BOOLEAN DEFAULT false,         -- Campus multimedia
  acceso_campus_completo  BOOLEAN DEFAULT false,         -- Cursos, podcasts, videoconfs
  gestion_turnos          BOOLEAN DEFAULT false,         -- Sistema de agendamiento
  perfil_validado         BOOLEAN DEFAULT false,         -- Sello de verificación
  credencial_virtual      BOOLEAN DEFAULT false,         -- Credencial digital
  networking              BOOLEAN DEFAULT false,         -- Acceso a red profesional
  beneficios_exclusivos   BOOLEAN DEFAULT false,         -- Descuentos y convenios
  difusion_profesional    BOOLEAN DEFAULT false,         -- Aparece destacado

  activo                  BOOLEAN DEFAULT true,
  creado_en               TIMESTAMP DEFAULT NOW(),
  actualizado_en          TIMESTAMP DEFAULT NOW()
);

-- Planes iniciales del sistema
INSERT INTO planes_suscripcion (
  nombre, slug, precio_mensual, precio_anual,
  aparece_en_grilla, max_consultas_mes, acceso_campus,
  acceso_campus_completo, gestion_turnos, perfil_validado,
  credencial_virtual, networking, beneficios_exclusivos, difusion_profesional
) VALUES
  ('Gratuito', 'gratuito', 0, 0,
   true, 3, false, false, false, false, false, false, false, false),

  ('Básico', 'basico', 4999, 49990,
   true, 20, true, false, true, true, false, false, false, false),

  ('Premium', 'premium', 9999, 99990,
   true, NULL, true, true, true, true, true, true, true, true)

ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TABLA: usuarios
-- Tabla central de todos los usuarios del sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,               -- bcrypt hash
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  telefono        VARCHAR(30),
  avatar_url      TEXT,                                -- URL de foto de perfil
  rol_id          INTEGER REFERENCES roles(id) NOT NULL,

  -- Control de cuenta
  email_verificado    BOOLEAN DEFAULT false,
  token_verificacion  VARCHAR(255),                   -- Token para verificar email
  token_reset_pass    VARCHAR(255),                   -- Token para reset de contraseña
  token_reset_expira  TIMESTAMP,
  activo              BOOLEAN DEFAULT true,
  ultimo_login        TIMESTAMP,

  creado_en       TIMESTAMP DEFAULT NOW(),
  actualizado_en  TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);


-- ─────────────────────────────────────────────────────────────
-- TABLA: perfiles_abogado
-- Información profesional específica de abogados
-- Separada de usuarios para mantener la tabla principal limpia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles_abogado (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id          UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Información profesional
  matricula           VARCHAR(100),                    -- Número de matrícula
  matricula_verificada BOOLEAN DEFAULT false,          -- Verificada por admin
  especialidades      TEXT[],                          -- Array: ['Civil', 'Laboral', ...]
  descripcion         TEXT,                            -- Bio profesional
  anos_experiencia    INTEGER,

  -- Información de contacto público
  provincia           VARCHAR(100) DEFAULT 'Buenos Aires',
  ciudad              VARCHAR(100) DEFAULT 'CABA',
  direccion_consultorio TEXT,
  atiende_online      BOOLEAN DEFAULT true,
  atiende_presencial  BOOLEAN DEFAULT true,

  -- Suscripción activa
  plan_id             INTEGER REFERENCES planes_suscripcion(id) DEFAULT 1,
  suscripcion_activa  BOOLEAN DEFAULT false,
  suscripcion_inicio  TIMESTAMP,
  suscripcion_fin     TIMESTAMP,
  mp_subscription_id  VARCHAR(255),                   -- ID de suscripción en MercadoPago

  -- Métricas de perfil (calculadas)
  calificacion_promedio DECIMAL(3,2) DEFAULT 0,       -- 0.00 a 5.00
  total_calificaciones  INTEGER DEFAULT 0,
  consultas_completadas INTEGER DEFAULT 0,

  -- Credencial virtual
  credencial_codigo   VARCHAR(50) UNIQUE,              -- Código único de credencial
  credencial_activa   BOOLEAN DEFAULT false,

  -- Control
  perfil_completo     BOOLEAN DEFAULT false,           -- Llenó todos los campos
  visible_en_grilla   BOOLEAN DEFAULT false,           -- Aprobado para aparecer

  creado_en           TIMESTAMP DEFAULT NOW(),
  actualizado_en      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_plan ON perfiles_abogado(plan_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_especialidades ON perfiles_abogado USING GIN(especialidades);
CREATE INDEX IF NOT EXISTS idx_perfiles_ciudad ON perfiles_abogado(ciudad);


-- ─────────────────────────────────────────────────────────────
-- TABLA: especialidades_catalogo
-- Catálogo de especialidades del derecho para filtros
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS especialidades_catalogo (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(100) UNIQUE NOT NULL,
  icono   VARCHAR(10),    -- Emoji o código de icono
  activa  BOOLEAN DEFAULT true
);

INSERT INTO especialidades_catalogo (nombre, icono) VALUES
  ('Derecho Civil',           '⚖️'),
  ('Derecho Laboral',         '👷'),
  ('Derecho Penal',           '🔒'),
  ('Derecho de Familia',      '👨‍👩‍👧'),
  ('Derecho Comercial',       '🏢'),
  ('Derecho Administrativo',  '📋'),
  ('Derecho Tributario',      '💰'),
  ('Derecho Inmobiliario',    '🏠'),
  ('Derecho de Daños',        '🏥'),
  ('Derecho del Consumidor',  '🛒'),
  ('Propiedad Intelectual',   '💡'),
  ('Derecho Migratorio',      '🌍'),
  ('Derecho Societario',      '🤝'),
  ('Derecho Ambiental',       '🌿'),
  ('Mediación',               '🕊️')
ON CONFLICT (nombre) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TABLA: consultas
-- Registro de todas las consultas/turnos entre clientes y abogados
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  abogado_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Detalles de la consulta
  tipo            VARCHAR(20) CHECK (tipo IN ('online', 'presencial')) DEFAULT 'online',
  especialidad    VARCHAR(100),
  descripcion     TEXT NOT NULL,         -- Descripción del caso del cliente
  fecha_hora      TIMESTAMP NOT NULL,    -- Fecha y hora del turno
  duracion_min    INTEGER DEFAULT 60,    -- Duración en minutos

  -- Estado del flujo
  estado          VARCHAR(30) CHECK (estado IN (
    'pendiente',    -- El cliente solicitó el turno
    'confirmada',   -- El abogado confirmó
    'en_curso',     -- La consulta está ocurriendo
    'completada',   -- Finalizada exitosamente
    'cancelada',    -- Cancelada por alguna de las partes
    'no_asistio'    -- El cliente no se presentó
  )) DEFAULT 'pendiente',

  -- Información de cancelación (si aplica)
  cancelada_por   VARCHAR(20) CHECK (cancelada_por IN ('cliente', 'abogado', 'admin')),
  motivo_cancelacion TEXT,

  -- Link de videollamada (para consultas online)
  link_reunion    TEXT,

  -- Notas privadas del abogado (no visibles para el cliente)
  notas_abogado   TEXT,

  creado_en       TIMESTAMP DEFAULT NOW(),
  actualizado_en  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_cliente ON consultas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_abogado ON consultas(abogado_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_consultas_estado ON consultas(estado);


-- ─────────────────────────────────────────────────────────────
-- TABLA: calificaciones
-- Sistema de reseñas de clientes hacia abogados
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calificaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID UNIQUE REFERENCES consultas(id) ON DELETE CASCADE, -- Una calificación por consulta
  cliente_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  abogado_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,

  puntaje     INTEGER CHECK (puntaje BETWEEN 1 AND 5) NOT NULL,
  comentario  TEXT,
  publica     BOOLEAN DEFAULT true,    -- El abogado puede pedir que se oculte si es spam

  creado_en   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_abogado ON calificaciones(abogado_id);


-- ─────────────────────────────────────────────────────────────
-- TABLA: contenido_campus
-- Material educativo del campus multimedia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contenido_campus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo            VARCHAR(30) CHECK (tipo IN (
    'curso',
    'articulo',
    'podcast',
    'videoconferencia',
    'biblioteca',
    'congreso'
  )) NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  descripcion     TEXT,
  contenido_url   TEXT,                              -- URL del video, PDF, audio
  miniatura_url   TEXT,                              -- Imagen de portada
  duracion_min    INTEGER,                           -- Duración estimada en minutos
  autor           VARCHAR(255),
  especialidad    VARCHAR(100),

  -- Control de acceso por plan
  plan_requerido  VARCHAR(50) DEFAULT 'basico',      -- 'gratuito', 'basico', 'premium'

  -- Para cursos con módulos
  es_serie        BOOLEAN DEFAULT false,
  serie_id        UUID REFERENCES contenido_campus(id),
  orden_en_serie  INTEGER,

  -- Evento programado (para videoconferencias/congresos)
  es_evento       BOOLEAN DEFAULT false,
  fecha_evento    TIMESTAMP,
  link_evento     TEXT,
  cupos_max       INTEGER,

  activo          BOOLEAN DEFAULT true,
  creado_en       TIMESTAMP DEFAULT NOW(),
  actualizado_en  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campus_tipo ON contenido_campus(tipo);
CREATE INDEX IF NOT EXISTS idx_campus_plan ON contenido_campus(plan_requerido);


-- ─────────────────────────────────────────────────────────────
-- TABLA: progreso_campus
-- Seguimiento del progreso de cada abogado en el campus
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progreso_campus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido_id    UUID REFERENCES contenido_campus(id) ON DELETE CASCADE,
  completado      BOOLEAN DEFAULT false,
  porcentaje      INTEGER DEFAULT 0,        -- 0 a 100
  ultima_vez      TIMESTAMP DEFAULT NOW(),

  UNIQUE(usuario_id, contenido_id)          -- Un registro por usuario/contenido
);


-- ─────────────────────────────────────────────────────────────
-- TABLA: beneficios
-- Descuentos y convenios disponibles según plan
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(255) NOT NULL,
  descripcion     TEXT,
  categoria       VARCHAR(100),          -- 'librería', 'gastronomía', 'coworking', etc.
  descuento_pct   INTEGER,               -- Porcentaje de descuento
  codigo_descuento VARCHAR(100),
  logo_url        TEXT,
  link_externo    TEXT,
  plan_minimo     VARCHAR(50) DEFAULT 'premium',
  activo          BOOLEAN DEFAULT true,
  creado_en       TIMESTAMP DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- TABLA: pagos
-- Registro de todos los pagos procesados por MercadoPago
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  plan_id             INTEGER REFERENCES planes_suscripcion(id),

  -- Datos de MercadoPago
  mp_payment_id       VARCHAR(255) UNIQUE,    -- ID del pago en MP
  mp_status           VARCHAR(50),            -- 'approved', 'rejected', 'pending'
  mp_status_detail    VARCHAR(100),

  monto               DECIMAL(10,2) NOT NULL,
  moneda              VARCHAR(10) DEFAULT 'ARS',
  descripcion         VARCHAR(255),
  periodo             VARCHAR(20) CHECK (periodo IN ('mensual', 'anual')),

  -- Cuándo aplica la suscripción
  periodo_inicio      TIMESTAMP,
  periodo_fin         TIMESTAMP,

  creado_en           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_mp_id ON pagos(mp_payment_id);


-- ─────────────────────────────────────────────────────────────
-- TABLA: notificaciones
-- Centro de notificaciones para todos los usuarios
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(50),           -- 'turno_confirmado', 'nueva_calificacion', etc.
  titulo      VARCHAR(255) NOT NULL,
  mensaje     TEXT,
  leida       BOOLEAN DEFAULT false,
  link        TEXT,                  -- Ruta a donde redirigir al hacer click
  creado_en   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);


-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN: actualizar campo updated_at automáticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas con campo actualizado_en
CREATE TRIGGER trigger_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_perfiles_updated
  BEFORE UPDATE ON perfiles_abogado
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_consultas_updated
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_campus_updated
  BEFORE UPDATE ON contenido_campus
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
