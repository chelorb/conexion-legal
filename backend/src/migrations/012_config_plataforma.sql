-- ============================================================
-- migrations/009_config_plataforma.sql
-- Tabla de configuración general de la plataforma
-- Estructura clave-valor para no tener que crear columnas
-- cada vez que se agrega una configuración nueva
-- ============================================================

CREATE TABLE IF NOT EXISTS config_plataforma (
  clave       VARCHAR(100) PRIMARY KEY,
  valor       TEXT,
  descripcion VARCHAR(255),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Configuración inicial: número de WhatsApp del admin
-- Formato: código de país + número sin espacios ni guiones
-- Ejemplo: 5492984123456 (Argentina, Río Negro)
INSERT INTO config_plataforma (clave, valor, descripcion) VALUES
  ('whatsapp_admin', '', 'Número de WhatsApp del admin para solicitudes de grupos (con código de país, sin + ni espacios)')
ON CONFLICT (clave) DO NOTHING;
