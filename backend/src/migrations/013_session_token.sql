-- ============================================================
-- Migración 013: Control de sesión única por usuario
-- Agrega la columna session_token a la tabla usuarios
--
-- Propósito: garantizar que solo exista UNA sesión activa
-- por usuario a la vez. Cada login genera un nuevo UUID que
-- se guarda acá y se embebe en el JWT. El middleware verifica
-- que ambos coincidan — si no coinciden, la sesión es inválida.
--
-- Ejecutar en Neon SQL Editor (una sola vez):
-- ============================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS session_token UUID DEFAULT NULL;

-- Índice para acelerar la búsqueda por session_token en el middleware
CREATE INDEX IF NOT EXISTS idx_usuarios_session_token
  ON usuarios (session_token)
  WHERE session_token IS NOT NULL;

-- Comentario descriptivo en la columna
COMMENT ON COLUMN usuarios.session_token IS
  'UUID de la sesión activa. Se renueva en cada login. Si no coincide con el JWT, la sesión es inválida.';
