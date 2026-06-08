-- ============================================================
-- migrations/009_documentos_abogado.sql
-- Sistema de documentos con Cloudinary y flujo de aprobación
-- ============================================================

-- Tabla principal de documentos
CREATE TABLE IF NOT EXISTS documentos_abogado (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  abogado_id    UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL
                CHECK (tipo IN ('credencial', 'titulo', 'cuil', 'otro')),
  nombre        VARCHAR(255) NOT NULL,          -- Nombre descriptivo (ej: "Título - UBA")
  cloudinary_id TEXT        NOT NULL,           -- public_id en Cloudinary
  url           TEXT        NOT NULL,           -- URL de Cloudinary
  estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo TEXT,                          -- Si fue rechazado
  revisado_por  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_en   TIMESTAMP,
  creado_en     TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_abogado
  ON documentos_abogado(abogado_id, tipo, estado);

CREATE INDEX IF NOT EXISTS idx_docs_pendientes
  ON documentos_abogado(estado, creado_en DESC);
