import { cookies } from "next/headers";
import { createDemoSession, getDemoUser, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const userId = await getDemoUser();
  return Response.json({ authenticated: Boolean(userId), userId });
}

export async function POST() {
  try {
    const token = await createDemoSession();
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
      priority: "high",
    });
    return Response.json({ authenticated: true, userId: "demo-user" });
  } catch {
    return Response.json({ error: "Demo authentication is not configured." }, { status: 503 });
  }
}

export async function DELETE() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return Response.json({ authenticated: false });
}

