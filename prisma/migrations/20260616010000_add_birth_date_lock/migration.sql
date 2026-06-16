-- Bloqueo anti-fraude: la fecha de nacimiento solo puede establecerse/cambiarse
-- una vez desde el perfil; luego requiere verificación de la clínica.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date_locked" BOOLEAN NOT NULL DEFAULT false;
