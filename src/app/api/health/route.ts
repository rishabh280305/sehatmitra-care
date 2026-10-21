export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ service: "sehatmitra-care", status: "ok", stage: "development", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
