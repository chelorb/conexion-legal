-- ============================================================
-- Migración 015: Solicitudes de cambio de plan por abogados
--
-- Cuando un abogado quiere cambiar de plan, en lugar de hacerlo
-- automáticamente, se guarda el plan solicitado acá y se notifica
-- al admin para que lo procese manualmente.
--
-- Ejecutar en Neon SQL Editor (una sola vez):
-- ============================================================

ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS plan_solicitado_id INTEGER
    REFERENCES planes_suscripcion(id) DEFAULT NULL;

ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS plan_solicitado_en TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN perfiles_abogado.plan_solicitado_id IS
  'Plan que el abogado solicitó. El admin lo procesa manualmente desde el panel.';

COMMENT ON COLUMN perfiles_abogado.plan_solicitado_en IS
  'Fecha en que el abogado realizó la solicitud de cambio de plan.';
