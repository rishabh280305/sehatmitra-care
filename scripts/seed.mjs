const baseUrl = process.env.BASE_URL ?? "https://sehatmitra-care.vercel.app";
const auth = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
if (!auth.ok) throw new Error(`Demo authentication failed: HTTP ${auth.status}`);
const cookie = auth.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("Demo session cookie was not returned");
const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const response = await fetch(`${baseUrl}/api/appointments`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie, "Idempotency-Key": "b15b1db0-f41c-4eb8-9e12-64ed4d138a17" }, body: JSON.stringify({ patientAlias: "Synthetic Seed A-001", careType: "general", scheduledFor }) });
if (!response.ok) throw new Error(`Seed failed: HTTP ${response.status} ${await response.text()}`);
console.log("Verified the idempotent synthetic appointment seed through the authenticated API.");
