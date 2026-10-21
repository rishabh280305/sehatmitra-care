CREATE SCHEMA IF NOT EXISTS sehatmitra;
CREATE TABLE IF NOT EXISTS sehatmitra.appointment_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  patient_alias text NOT NULL,
  care_type text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
