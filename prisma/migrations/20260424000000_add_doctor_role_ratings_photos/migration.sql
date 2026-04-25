-- Add DOCTOR to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DOCTOR';

-- Add POSTPONED to AppointmentStatus enum
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'POSTPONED';

-- Add photoUrl to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;

-- Add userId to doctors (link doctor to user account)
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "rating_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_key" UNIQUE ("user_id");
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add cancel/postpone reason fields to appointments
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "postpone_reason" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "new_date" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "new_time" TEXT;

-- Create doctor_ratings table
CREATE TABLE IF NOT EXISTS "doctor_ratings" (
  "id" TEXT NOT NULL,
  "appointment_id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "stars" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_ratings_appointment_id_key" UNIQUE ("appointment_id"),
  CONSTRAINT "doctor_ratings_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_ratings_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
