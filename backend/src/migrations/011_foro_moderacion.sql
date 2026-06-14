-- ============================================================
-- migrations/008_foro_moderacion.sql
-- Agrega campos de edición/moderación al foro
-- Permite registrar cuándo y quién editó un hilo o respuesta
-- ============================================================

-- ── En foro_hilos ─────────────────────────────────────────────
ALTER TABLE foro_hilos
  ADD COLUMN IF NOT EXISTS editado_en     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS editado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- ── En foro_respuestas ────────────────────────────────────────
ALTER TABLE foro_respuestas
  ADD COLUMN IF NOT EXISTS editado_en     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS editado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
