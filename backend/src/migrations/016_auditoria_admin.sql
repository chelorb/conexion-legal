-- ============================================================
-- Migración 016: Tabla de auditoría de acciones del admin
--
-- Registra automáticamente cada acción crítica realizada por
-- un administrador: quién, qué, sobre quién, cuándo y qué cambió.
-- Permite hacer auditorías y rastrear problemas fácilmente.
--
-- Ejecutar en Neon SQL Editor (una sola vez):
-- ============================================================

CREATE TABLE IF NOT EXISTS auditoria_admin (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quién realizó la acción
  admin_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  admin_email   TEXT,                          -- guardamos el email por si el usuario se elimina

  -- Qué acción fue
  accion        VARCHAR(100) NOT NULL,         -- 'aprobar_abogado', 'cambiar_plan', etc.
  descripcion   TEXT,                          -- descripción legible para humanos

  -- Sobre qué entidad
  entidad       VARCHAR(50),                   -- 'usuario', 'plan', 'config', etc.
  entidad_id    TEXT,                          -- id del objeto afectado
  entidad_label TEXT,                          -- nombre/email legible del objeto (ej: "Juan Pérez")

  -- Qué cambió (snapshot antes/después en JSON)
  datos_antes   JSONB DEFAULT NULL,
  datos_despues JSONB DEFAULT NULL,

  -- Metadata
  ip            VARCHAR(45) DEFAULT NULL,      -- IP del admin (para auditoría de acceso)
  creado_en     TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas frecuentes en el panel de auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_admin_id   ON auditoria_admin (admin_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion      ON auditoria_admin (accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad     ON auditoria_admin (entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado_en   ON auditoria_admin (creado_en DESC);

COMMENT ON TABLE auditoria_admin IS
  'Log de auditoría de acciones críticas realizadas por administradores.';
