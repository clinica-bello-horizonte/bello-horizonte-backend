-- AlterTable: datos de paciente y seguro en la cita
ALTER TABLE "appointments" ADD COLUMN "patient_dni" TEXT;
ALTER TABLE "appointments" ADD COLUMN "insurance" TEXT;

-- AlterTable: seguro en perfil de salud
ALTER TABLE "health_profiles" ADD COLUMN "insurance" TEXT;

-- AlterTable: seguro en familiar
ALTER TABLE "dependents" ADD COLUMN "insurance" TEXT;

-- DNI único por usuario en familiares
CREATE UNIQUE INDEX "dependents_user_id_dni_key" ON "dependents"("user_id", "dni");
