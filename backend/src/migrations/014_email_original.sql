-- ============================================================
-- Migración 014: Guardar email original al anonimizar abogados rechazados
--
-- Cuando se usa "Permitir re-registro", el email se anonimiza
-- con un sufijo __rechazado_TIMESTAMP para liberar el email real.
-- Esta columna guarda el email original para poder restaurarlo
-- si el admin luego usa "Aprobar directamente".
--
-- Ejecutar en Neon SQL Editor (una sola vez):
-- ============================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS email_original TEXT DEFAULT NULL;

COMMENT ON COLUMN usuarios.email_original IS
  'Email real del usuario cuando fue anonimizado por "Permitir re-registro". Se restaura al aprobar directamente.';

-- Para el abogado que ya tiene el email anonimizado, corregirlo manualmente:
-- UPDATE usuarios
-- SET email_original = 'ezequielmaureira@gmail.com',
--     email          = 'ezequielmaureira@gmail.com'
-- WHERE email LIKE 'ezequielmaureira@gmail.com__rechazado_%';
