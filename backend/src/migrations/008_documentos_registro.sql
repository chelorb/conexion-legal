-- ============================================================
-- migrations/008_documentos_registro.sql
-- Agrega campos de documentación profesional a perfiles_abogado
-- Ejecutar UNA SOLA VEZ en Neon
-- ============================================================

ALTER TABLE perfiles_abogado
  ADD COLUMN IF NOT EXISTS cuil                     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS titulo_universitario     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS universidad              VARCHAR(255),
  ADD COLUMN IF NOT EXISTS anio_graduacion          INTEGER,
  ADD COLUMN IF NOT EXISTS nro_credencial_letrado   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS doc_credencial_url       TEXT,
  ADD COLUMN IF NOT EXISTS doc_titulo_url           TEXT,
  ADD COLUMN IF NOT EXISTS doc_cuil_url             TEXT;

-- Tabla de notificaciones de cambio de plan
CREATE TABLE IF NOT EXISTS notificaciones_plan (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  plan_id      INTEGER REFERENCES planes_suscripcion(id) ON DELETE SET NULL,
  tipo         VARCHAR(50)  NOT NULL,
  titulo       VARCHAR(255) NOT NULL,
  mensaje      TEXT         NOT NULL,
  leida        BOOLEAN      DEFAULT false,
  creado_en    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_plan_usuario
  ON notificaciones_plan(usuario_id, leida, creado_en DESC);

-- Tabla de funcionalidades custom por plan
CREATE TABLE IF NOT EXISTS plan_funcionalidades (
  id        UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id   INTEGER REFERENCES planes_suscripcion(id) ON DELETE CASCADE,
  nombre    VARCHAR(200) NOT NULL,
  icono     VARCHAR(10)  DEFAULT '✓',
  orden     INTEGER      DEFAULT 0,
  activa    BOOLEAN      DEFAULT true,
  creado_en TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_func_plan
  ON plan_funcionalidades(plan_id, orden ASC);
