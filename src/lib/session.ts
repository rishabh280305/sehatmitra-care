import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "portfolio_demo_session";
export const DEMO_USER_ID = "demo-user";

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

export async function createDemoSession() {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const payload = `${DEMO_USER_ID}.${expires}`;
  return `${payload}.${await signature(payload)}`;
}

export async function getDemoUser() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [userId, expiresText, supplied] = token.split(".");
    if (!userId || !expiresText || !supplied || Number(expiresText) <= Date.now() / 1000) return null;
    const expected = await signature(`${userId}.${expiresText}`);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return userId === DEMO_USER_ID ? userId : null;
  } catch {
    return null;
  }
}

