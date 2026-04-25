CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "doctor_id"  TEXT NOT NULL,
  "date"       TEXT NOT NULL,
  "time"       TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "waitlist_entries_user_id_doctor_id_date_time_key"
    UNIQUE ("user_id", "doctor_id", "date", "time"),
  CONSTRAINT "waitlist_entries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "waitlist_entries_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE
);
