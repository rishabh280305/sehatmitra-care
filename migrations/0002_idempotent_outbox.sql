ALTER TABLE sehatmitra.appointment_requests ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS appointment_requests_idempotency
  ON sehatmitra.appointment_requests (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
