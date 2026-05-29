-- ============================================================
-- migrations/003_planes_basico_comunidad.sql
-- Simplifica los planes a dos: Básico y Comunidad
-- ============================================================

-- PASO 1: Liberar referencias de FK antes de borrar
UPDATE perfiles_abogado SET plan_id = NULL;

-- PASO 2: Borrar planes anteriores
DELETE FROM planes_suscripcion;

-- PASO 3: Insertar los dos nuevos planes
-- Las columnas deben coincidir exactamente con los valores
INSERT INTO planes_suscripcion (
  nombre,
  slug,
  precio_mensual,
  precio_anual,
  aparece_en_grilla,
  max_consultas_mes,
  acceso_campus,
  acceso_campus_completo,
  gestion_turnos,
  perfil_validado,
  credencial_virtual,
  networking,
  beneficios_exclusivos,
  difusion_profesional,
  activo
) VALUES
  (
    'Básico',
    'basico',
    4999,
    49990,
    true,
    20,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    false,
    true
  ),
  (
    'Comunidad',
    'comunidad',
    9999,
    99990,
    true,
    NULL,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  );

-- PASO 4: Asignar plan Básico a todos los abogados
UPDATE perfiles_abogado
SET plan_id = (SELECT id FROM planes_suscripcion WHERE slug = 'basico');

-- PASO 5: Crear tabla de inscripciones a eventos
CREATE TABLE IF NOT EXISTS inscripciones_eventos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido_id UUID REFERENCES contenido_campus(id) ON DELETE CASCADE,
  creado_en    TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, contenido_id)
);

CREATE INDEX IF NOT EXISTS idx_inscripciones_evento
  ON inscripciones_eventos(contenido_id);

CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario
  ON inscripciones_eventos(usuario_id);
