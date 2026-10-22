import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "portfolio_demo_session";
export const ROLES = ["patient", "asha", "doctor", "admin"] as const;
export type DemoRole = typeof ROLES[number];

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(signed).toString("base64url");
}

export async function createDemoSession(role: DemoRole = "patient") {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const payload = `demo-${role}.${role}.${expires}`;
  return `${payload}.${await signature(payload)}`;
}

export async function getDemoSession() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [userId, role, expiresText, supplied] = token.split(".");
    if (!userId || !ROLES.includes(role as DemoRole) || !expiresText || !supplied || Number(expiresText) <= Date.now() / 1000) return null;
    const expected = await signature(`${userId}.${role}.${expiresText}`);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return userId === `demo-${role}` ? { userId, role: role as DemoRole } : null;
  } catch {
    return null;
  }
}

export async function getDemoUser() { return (await getDemoSession())?.userId ?? null; }

