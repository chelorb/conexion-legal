-- ============================================================
-- migrations/010_inscripciones_codigos.sql
-- Agrega código único y asistencia a inscripciones de eventos
-- ============================================================

-- Agregar columnas a inscripciones_eventos
ALTER TABLE inscripciones_eventos
  ADD COLUMN IF NOT EXISTS codigo_acceso VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS asistio       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validado_en   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS creado_en     TIMESTAMP DEFAULT NOW();

-- Generar códigos para inscripciones existentes
UPDATE inscripciones_eventos
SET codigo_acceso = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
WHERE codigo_acceso IS NULL;

-- Índice para búsqueda rápida por código
CREATE INDEX IF NOT EXISTS idx_inscripciones_codigo
  ON inscripciones_eventos(codigo_acceso);
