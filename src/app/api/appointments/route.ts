import { z } from "zod";
import { database } from "@/lib/db";
import { getDemoSession } from "@/lib/session";
import { canConfirmAppointment, canCreateAppointment } from "@/lib/permissions";

const inputSchema = z.object({
  patientAlias: z.string().trim().min(2).max(40),
  careType: z.enum(["general", "maternal", "child", "follow-up"]),
  scheduledFor: z.string().datetime({ offset: true }).refine((value) => new Date(value).getTime() > Date.now(), "Appointment must be in the future"),
});

export async function GET() {
  const session = await getDemoSession();
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });
  const sql = await database();
  const items = session.role === "patient" || session.role === "asha"
    ? await sql`SELECT id, patient_alias, care_type, scheduled_for, status, created_at FROM sehatmitra.appointment_requests WHERE user_id = ${session.userId} ORDER BY scheduled_for ASC`
    : await sql`SELECT id, patient_alias, care_type, scheduled_for, status, created_at FROM sehatmitra.appointment_requests ORDER BY scheduled_for ASC LIMIT 200`;
  return Response.json({ items, role: session.role, privacy: "Synthetic aliases only. Do not enter real patient information." });
}

export async function POST(request: Request) {
  const session = await getDemoSession();
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canCreateAppointment(session.role)) return Response.json({ error: "Only patient and ASHA roles can create requests." }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Use a synthetic alias and choose a valid future appointment time." }, { status: 400 });
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return Response.json({ error: "Idempotency-Key must be a version 4 UUID." }, { status: 400 });
  }
  const sql = await database();
  if (idempotencyKey) {
    const [item] = await sql`INSERT INTO sehatmitra.appointment_requests (user_id, patient_alias, care_type, scheduled_for, idempotency_key)
      VALUES (${session.userId}, ${parsed.data.patientAlias}, ${parsed.data.careType}, ${parsed.data.scheduledFor}, ${idempotencyKey})
      ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
      DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
      RETURNING id, patient_alias, care_type, scheduled_for, status, created_at`;
    return Response.json({ item, idempotencyKey }, { status: 201 });
  }
  const [item] = await sql`INSERT INTO sehatmitra.appointment_requests (user_id, patient_alias, care_type, scheduled_for)
      VALUES (${session.userId}, ${parsed.data.patientAlias}, ${parsed.data.careType}, ${parsed.data.scheduledFor})
      RETURNING id, patient_alias, care_type, scheduled_for, status, created_at`;
  return Response.json({ item, idempotencyKey: null }, { status: 201 });
}

const actionSchema=z.object({id:z.coerce.number().int().positive(),action:z.enum(["confirm","cancel","reschedule"]),scheduledFor:z.string().datetime({offset:true}).optional()});
export async function PATCH(request:Request){
  const session=await getDemoSession();if(!session)return Response.json({error:"Authentication required."},{status:401});const parsed=actionSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Choose a valid appointment action."},{status:400});
  if(parsed.data.action==="confirm"&&!canConfirmAppointment(session.role))return Response.json({error:"Only doctors or administrators can confirm appointments."},{status:403});
  if(parsed.data.action==="reschedule"&&(!parsed.data.scheduledFor||new Date(parsed.data.scheduledFor).getTime()<=Date.now()))return Response.json({error:"Rescheduling requires a future time."},{status:400});
  const sql=await database();const ownerScope=(["patient","asha"] as string[]).includes(session.role);
  const rows=parsed.data.action==="reschedule"
    ? await sql`UPDATE sehatmitra.appointment_requests SET scheduled_for=${parsed.data.scheduledFor!} WHERE id=${parsed.data.id} AND (${!ownerScope} OR user_id=${session.userId}) AND status!='cancelled' RETURNING id,patient_alias,care_type,scheduled_for,status,created_at,user_id`
    : await sql`UPDATE sehatmitra.appointment_requests SET status=${parsed.data.action==="confirm"?"confirmed":"cancelled"} WHERE id=${parsed.data.id} AND (${!ownerScope} OR user_id=${session.userId}) AND status!='cancelled' RETURNING id,patient_alias,care_type,scheduled_for,status,created_at,user_id`;
  const item=rows[0];if(!item)return Response.json({error:"Appointment was not found, is already cancelled, or is outside your role scope."},{status:404});
  await sql`INSERT INTO sehatmitra.audit_events(actor_id,actor_role,action,entity_type,entity_id,details) VALUES(${session.userId},${session.role},${parsed.data.action},'appointment',${String(item.id)},${JSON.stringify({scheduledFor:item.scheduled_for,status:item.status})}::jsonb)`;
  const actionText=parsed.data.action==="cancel"?"cancelled":parsed.data.action==="confirm"?"confirmed":"rescheduled";
  await sql`INSERT INTO sehatmitra.notifications(user_id,message) VALUES(${String(item.user_id)},${`Appointment ${item.id} was ${actionText}.`})`;
  return Response.json({item});
}
