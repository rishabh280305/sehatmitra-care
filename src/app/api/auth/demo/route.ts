import { cookies } from "next/headers";
import { createDemoSession, getDemoSession, ROLES, SESSION_COOKIE, type DemoRole } from "@/lib/session";

export async function GET() {
  const session = await getDemoSession();
  return Response.json({ authenticated: Boolean(session), ...session });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { role?: string };
    const role = (body.role ?? "patient") as DemoRole;
    if (!ROLES.includes(role)) return Response.json({ error: "Choose patient, asha, doctor, or admin." }, { status: 400 });
    const token = await createDemoSession(role);
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
      priority: "high",
    });
    return Response.json({ authenticated: true, userId: `demo-${role}`, role });
  } catch {
    return Response.json({ error: "Demo authentication is not configured." }, { status: 503 });
  }
}

export async function DELETE() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return Response.json({ authenticated: false });
}

