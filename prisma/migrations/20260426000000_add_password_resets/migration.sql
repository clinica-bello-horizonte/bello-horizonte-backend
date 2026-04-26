CREATE TABLE IF NOT EXISTS "password_resets" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "code"       TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used"       BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_resets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
