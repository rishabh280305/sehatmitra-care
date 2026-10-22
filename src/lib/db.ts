import "server-only";
import { neon } from "@neondatabase/serverless";

function client() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

let initialized: Promise<void> | null = null;
export async function database() {
  const sql = client();
  initialized ??= (async () => {
    await sql`CREATE SCHEMA IF NOT EXISTS sehatmitra`;
    await sql`CREATE TABLE IF NOT EXISTS sehatmitra.appointment_requests (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id text NOT NULL,
      patient_alias text NOT NULL,
      care_type text NOT NULL,
      scheduled_for timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled')),
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`ALTER TABLE sehatmitra.appointment_requests ADD COLUMN IF NOT EXISTS idempotency_key text`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS appointment_requests_idempotency
      ON sehatmitra.appointment_requests (user_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL`;
    await sql`CREATE TABLE IF NOT EXISTS sehatmitra.field_visits (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      author_id text NOT NULL,
      patient_alias text NOT NULL,
      note text NOT NULL,
      referral text NOT NULL DEFAULT '',
      follow_up_on date,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS sehatmitra.audit_events (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      actor_id text NOT NULL,
      actor_role text NOT NULL,
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id text NOT NULL,
      details jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS sehatmitra.notifications (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id text NOT NULL,
      message text NOT NULL,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  })();
  await initialized;
  return sql;
}
