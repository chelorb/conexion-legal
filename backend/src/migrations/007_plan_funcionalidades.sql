-- ============================================================
-- migrations/007_plan_funcionalidades.sql
-- Funcionalidades custom por plan (además de las columnas base)
-- Permite al admin agregar features con nombre libre
-- ============================================================

-- Tabla de funcionalidades custom
CREATE TABLE IF NOT EXISTS plan_funcionalidades (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id   INTEGER REFERENCES planes_suscripcion(id) ON DELETE CASCADE,
  nombre    VARCHAR(200) NOT NULL,
  icono     VARCHAR(10) DEFAULT '✓',
  orden     INTEGER DEFAULT 0,
  activa    BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_func_plan ON plan_funcionalidades(plan_id, orden ASC);

-- Tabla de notificaciones de cambio de plan
CREATE TABLE IF NOT EXISTS notificaciones_plan (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  plan_id      INTEGER REFERENCES planes_suscripcion(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL, -- 'precio', 'funcionalidad', 'migracion', 'nuevo_plan'
  titulo       VARCHAR(255) NOT NULL,
  mensaje      TEXT NOT NULL,
  leida        BOOLEAN DEFAULT false,
  creado_en    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_plan_usuario
  ON notificaciones_plan(usuario_id, leida, creado_en DESC);
