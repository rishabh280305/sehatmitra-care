import { z } from "zod";
import { database } from "@/lib/db";
import { getDemoUser } from "@/lib/session";

const inputSchema = z.object({
  patientAlias: z.string().trim().min(2).max(40),
  careType: z.enum(["general", "maternal", "child", "follow-up"]),
  scheduledFor: z.string().datetime({ offset: true }).refine((value) => new Date(value).getTime() > Date.now(), "Appointment must be in the future"),
});

export async function GET() {
  const userId = await getDemoUser();
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });
  const sql = await database();
  const items = await sql`SELECT id, patient_alias, care_type, scheduled_for, status, created_at FROM sehatmitra.appointment_requests WHERE user_id = ${userId} ORDER BY scheduled_for ASC`;
  return Response.json({ items, privacy: "Synthetic aliases only. Do not enter real patient information." });
}

export async function POST(request: Request) {
  const userId = await getDemoUser();
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Use a synthetic alias and choose a valid future appointment time." }, { status: 400 });
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return Response.json({ error: "Idempotency-Key must be a version 4 UUID." }, { status: 400 });
  }
  const sql = await database();
  if (idempotencyKey) {
    const [item] = await sql`INSERT INTO sehatmitra.appointment_requests (user_id, patient_alias, care_type, scheduled_for, idempotency_key)
      VALUES (${userId}, ${parsed.data.patientAlias}, ${parsed.data.careType}, ${parsed.data.scheduledFor}, ${idempotencyKey})
      ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
      DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
      RETURNING id, patient_alias, care_type, scheduled_for, status, created_at`;
    return Response.json({ item, idempotencyKey }, { status: 201 });
  }
  const [item] = await sql`INSERT INTO sehatmitra.appointment_requests (user_id, patient_alias, care_type, scheduled_for)
      VALUES (${userId}, ${parsed.data.patientAlias}, ${parsed.data.careType}, ${parsed.data.scheduledFor})
      RETURNING id, patient_alias, care_type, scheduled_for, status, created_at`;
  return Response.json({ item, idempotencyKey: null }, { status: 201 });
}
