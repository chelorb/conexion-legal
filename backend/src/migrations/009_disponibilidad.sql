-- ============================================================
-- migrations/009_disponibilidad.sql
-- Slots de disponibilidad semanal del abogado
-- Cada fila representa un horario disponible recurrente
-- (ej: todos los lunes a las 9:00hs, modalidad online)
-- ============================================================

CREATE TABLE IF NOT EXISTS disponibilidad_abogado (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  abogado_id  UUID    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dia_semana  INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  -- 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
  hora_inicio TIME    NOT NULL,
  -- Modalidad: 'online', 'presencial', 'ambas'
  modalidad   VARCHAR(20) NOT NULL DEFAULT 'ambas'
              CHECK (modalidad IN ('online', 'presencial', 'ambas')),
  activo      BOOLEAN NOT NULL DEFAULT true,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Índice para buscar disponibilidad de un abogado rápidamente
CREATE INDEX IF NOT EXISTS idx_disponibilidad_abogado
  ON disponibilidad_abogado(abogado_id, dia_semana, hora_inicio);

-- Evitar slots duplicados para el mismo abogado
CREATE UNIQUE INDEX IF NOT EXISTS idx_disponibilidad_unico
  ON disponibilidad_abogado(abogado_id, dia_semana, hora_inicio);
