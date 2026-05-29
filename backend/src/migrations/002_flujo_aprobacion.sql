-- ============================================================
-- migrations/002_flujo_aprobacion.sql
-- Agrega el flujo de aprobación de abogados por el admin
-- Los abogados nuevos quedan en estado "pendiente" hasta ser
-- revisados y aprobados manualmente por un administrador
-- ============================================================

-- Agregar columna de estado de aprobación al perfil del abogado
-- Los valores posibles son:
--   'pendiente'  → recién registrado, esperando revisión del admin
--   'aprobado'   → el admin lo habilitó, aparece en la grilla
--   'rechazado'  → el admin lo rechazó (puede volver a solicitar)
ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS estado_aprobacion VARCHAR(20)
    CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado'))
    DEFAULT 'pendiente';

-- Agregar columna para el motivo de rechazo (opcional, solo para rechazados)
ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

-- Agregar columna para registrar quién aprobó/rechazó y cuándo
ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS aprobado_en TIMESTAMP;

-- Índice para que el admin pueda filtrar rápido por estado
CREATE INDEX IF NOT EXISTS idx_perfiles_estado_aprobacion
  ON perfiles_abogado(estado_aprobacion);

-- Actualizar los abogados existentes del seed a "aprobado"
-- (los datos de prueba ya deberían estar visibles)
UPDATE perfiles_abogado
SET estado_aprobacion = 'aprobado'
WHERE visible_en_grilla = true;

-- Los que no están visibles quedan como pendientes (ya es el default)
