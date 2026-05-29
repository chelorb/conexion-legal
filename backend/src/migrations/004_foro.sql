-- ============================================================
-- migrations/004_foro.sql
-- Foro interno para abogados de la Comunidad
-- Estructura: categorias → hilos → respuestas
-- ============================================================

-- ── Categorías del foro ───────────────────────────────────────
-- Las crea el admin, los abogados no pueden crearlas
CREATE TABLE IF NOT EXISTS foro_categorias (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono       VARCHAR(10) DEFAULT '💬',
  orden       INTEGER DEFAULT 0,       -- Para ordenar las categorías en pantalla
  activa      BOOLEAN DEFAULT true,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Categorías iniciales
INSERT INTO foro_categorias (nombre, descripcion, icono, orden) VALUES
  ('Jurisprudencia',        'Análisis y debate de fallos judiciales relevantes.',       '⚖️',  1),
  ('Novedades legales',     'Cambios normativos, leyes nuevas y decretos.',             '📋',  2),
  ('Consultas entre colegas','Espacio para hacer consultas a otros profesionales.',     '🤝',  3),
  ('Marketing y desarrollo','Estrategias para hacer crecer tu práctica profesional.',   '📈',  4),
  ('General',               'Temas varios de la comunidad.',                            '💬',  5);

-- ── Hilos del foro ────────────────────────────────────────────
-- Un abogado crea un hilo dentro de una categoría
CREATE TABLE IF NOT EXISTS foro_hilos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id  INTEGER REFERENCES foro_categorias(id) ON DELETE CASCADE,
  autor_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  titulo        VARCHAR(255) NOT NULL,
  contenido     TEXT NOT NULL,           -- Primer mensaje del hilo
  fijado        BOOLEAN DEFAULT false,   -- El admin puede fijar hilos importantes
  cerrado       BOOLEAN DEFAULT false,   -- El admin puede cerrar el hilo
  vistas        INTEGER DEFAULT 0,       -- Contador de visitas
  creado_en     TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW() -- Se actualiza con cada respuesta nueva
);

CREATE INDEX IF NOT EXISTS idx_hilos_categoria ON foro_hilos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_hilos_autor     ON foro_hilos(autor_id);
CREATE INDEX IF NOT EXISTS idx_hilos_fecha     ON foro_hilos(actualizado_en DESC);

-- ── Respuestas del foro ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS foro_respuestas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hilo_id    UUID REFERENCES foro_hilos(id) ON DELETE CASCADE,
  autor_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  contenido  TEXT NOT NULL,
  creado_en  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respuestas_hilo  ON foro_respuestas(hilo_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_autor ON foro_respuestas(autor_id);

-- Trigger: actualizar fecha del hilo cuando llega una respuesta nueva
CREATE OR REPLACE FUNCTION actualizar_hilo_en_respuesta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE foro_hilos
  SET actualizado_en = NOW()
  WHERE id = NEW.hilo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_hilo
  AFTER INSERT ON foro_respuestas
  FOR EACH ROW EXECUTE FUNCTION actualizar_hilo_en_respuesta();
