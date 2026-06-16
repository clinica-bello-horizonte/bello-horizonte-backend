-- Fecha de nacimiento del paciente por cita (titular o familiar), para el QR de recepción.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "patient_birth_date" TEXT;
