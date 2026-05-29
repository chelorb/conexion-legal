-- ============================================================
-- migrations/005_links_interes.sql
-- Tabla para links de interés gestionados desde el admin
-- ============================================================

CREATE TABLE IF NOT EXISTS links_interes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      VARCHAR(255) NOT NULL,
  url         TEXT NOT NULL,
  descripcion TEXT,
  orden       INTEGER DEFAULT 0,
  activo      BOOLEAN DEFAULT true,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Link inicial
INSERT INTO links_interes (titulo, url, descripcion, orden) VALUES
  ('Nueva Abogacía — Enlaces útiles',
   'https://nueva-abogacia.org/enlaces-utiles',
   'Recursos y herramientas para el ejercicio de la profesión.',
   1);
