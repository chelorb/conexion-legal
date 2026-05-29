-- ============================================================
-- migrations/006_mensajes_consulta.sql
-- Tabla de mensajes internos dentro de una consulta
-- Permite al abogado y al cliente comunicarse antes/durante
-- ============================================================

CREATE TABLE IF NOT EXISTS mensajes_consulta (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id  UUID REFERENCES consultas(id) ON DELETE CASCADE,
  autor_id     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  contenido    TEXT NOT NULL,
  leido        BOOLEAN DEFAULT false,
  creado_en    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_consulta
  ON mensajes_consulta(consulta_id, creado_en ASC);
