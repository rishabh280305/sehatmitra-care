"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { enqueueAppointment, listQueuedAppointments, markQueuedAttempt, removeQueuedAppointment, type AppointmentPayload } from "@/lib/offline-outbox";
import { shouldRetry } from "@/lib/sync-policy";

type Appointment = { id: string; patient_alias: string; care_type: string; scheduled_for: string; status: string };

async function postAppointment(id: string, payload: AppointmentPayload) {
  return fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": id }, body: JSON.stringify(payload) });
}

export function AppointmentDemo() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);
  const [patientAlias, setPatientAlias] = useState("");
  const [careType, setCareType] = useState("general");
  const [scheduledFor, setScheduledFor] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);

  const refreshPending = useCallback(async () => setPending((await listQueuedAppointments()).length), []);
  const load = useCallback(async () => {
    const response = await fetch("/api/appointments", { cache: "no-store" });
    if (response.status === 401) return setAuthenticated(false);
    if (!response.ok) throw new Error("Could not load requests.");
    const data = await response.json(); setItems(data.items); setAuthenticated(true);
  }, []);
  const syncPending = useCallback(async () => {
    const queued = await listQueuedAppointments();
    let sent = 0;
    for (const item of queued) {
      try {
        const response = await postAppointment(item.id, item.payload);
        if (response.ok) { await removeQueuedAppointment(item.id); sent += 1; continue; }
        if (response.status === 401) break;
        if (shouldRetry(response.status)) { await markQueuedAttempt(item, `HTTP ${response.status}`); break; }
        await removeQueuedAppointment(item.id);
      } catch {
        await markQueuedAttempt(item, "Network unavailable");
        break;
      }
    }
    await refreshPending();
    if (sent > 0) { setMessage(`${sent} offline request${sent===1?"":"s"} synchronized.`); await load(); }
  }, [load, refreshPending]);

  useEffect(() => {
    const task = window.setTimeout(() => { void load().catch(() => { setAuthenticated(false); setMessage("The care workspace is temporarily unavailable."); }); }, 0);
    return () => window.clearTimeout(task);
  }, [load]);
  useEffect(() => {
    const task = window.setTimeout(() => { void refreshPending(); }, 0);
    const handleOnline = () => { setOnline(true); void syncPending(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline); window.addEventListener("offline", handleOffline);
    return () => { window.clearTimeout(task); window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [refreshPending, syncPending]);

  async function enterWorkspace() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/auth/demo", { method: "POST" });
    if (response.ok) { await load(); await syncPending(); } else setMessage("Demo sign-in is unavailable.");
    setBusy(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const payload = { patientAlias, careType, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : "" };
    const id = crypto.randomUUID();
    if (!navigator.onLine) {
      await enqueueAppointment({ id, payload, createdAt: new Date().toISOString(), attempts: 0 });
      setPatientAlias(""); setScheduledFor(""); setMessage("Offline: request stored on this device and queued for sync."); await refreshPending(); setBusy(false); return;
    }
    try {
      const response = await postAppointment(id, payload);
      const data = await response.json();
      if (response.ok) { setPatientAlias(""); setScheduledFor(""); setMessage("Synthetic appointment request saved."); await load(); }
      else setMessage(data.error ?? "Could not save the request.");
    } catch {
      await enqueueAppointment({ id, payload, createdAt: new Date().toISOString(), attempts: 0, lastError: "Network unavailable" });
      setPatientAlias(""); setScheduledFor(""); setMessage("Connection lost: request safely queued on this device."); await refreshPending();
    }
    setBusy(false);
  }

  return <section className="mx-auto max-w-6xl px-5 pb-24" aria-labelledby="care-demo-title"><div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-emerald-900/10 ring-1 ring-emerald-900/5 md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dcebe7] pb-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#0a9b7a]">OFFLINE-FIRST WORKFLOW</p><h2 id="care-demo-title" className="mt-2 text-3xl font-extrabold">Request an appointment</h2></div><div className="flex gap-2"><span className={`rounded-full px-3 py-2 text-xs font-bold ${online?"bg-[#e1f8ef] text-[#087d65]":"bg-[#fff2d6] text-[#76500a]"}`}>{online?"Online":"Offline"}</span><span className="rounded-full bg-[#f0f3f2] px-3 py-2 text-xs font-bold text-[#53716b]">{pending} queued</span></div></div>
    {authenticated===null ? <p className="py-10 text-[#6a827d]">Preparing the care workspace…</p> : !authenticated ? <div className="py-10"><p className="max-w-xl leading-7 text-[#53716b]">Open the demo workspace to create and revisit an appointment request. Never enter a real name, phone number, diagnosis, or medical record.</p><button onClick={enterWorkspace} disabled={busy} className="mt-5 rounded-xl bg-[#087d65] px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "OPENING…" : "ENTER SAFE DEMO"}</button></div> : <div className="grid gap-8 pt-6 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Synthetic patient alias<input required minLength={2} maxLength={40} value={patientAlias} onChange={e=>setPatientAlias(e.target.value)} placeholder="Patient A-104" className="mt-2 w-full rounded-xl border border-[#badbd2] bg-[#f8fcfb] px-4 py-3 outline-none focus:border-[#0a9b7a]" /></label><label className="block text-sm font-semibold">Care type<select value={careType} onChange={e=>setCareType(e.target.value)} className="mt-2 w-full rounded-xl border border-[#badbd2] bg-[#f8fcfb] px-4 py-3"><option value="general">General care</option><option value="maternal">Maternal care</option><option value="child">Child care</option><option value="follow-up">Follow-up</option></select></label><label className="block text-sm font-semibold">Preferred future time<input required type="datetime-local" value={scheduledFor} onChange={e=>setScheduledFor(e.target.value)} className="mt-2 w-full rounded-xl border border-[#badbd2] bg-[#f8fcfb] px-4 py-3" /></label><div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-[#087d65] px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "SAVING…" : online?"SAVE REQUEST":"QUEUE REQUEST"}</button>{pending>0&&online&&<button type="button" onClick={()=>void syncPending()} className="rounded-xl border border-[#badbd2] px-4 py-3 text-sm font-bold text-[#087d65]">Sync now</button>}</div>{message&&<p role="status" className="text-sm text-[#76500a]">{message}</p>}<p className="text-xs leading-5 text-[#6a827d]">Offline requests stay in this browser&apos;s IndexedDB. UUID idempotency prevents duplicate server rows after retries.</p></form>
      <div><p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6a827d]">Upcoming demo requests</p>{items.length===0 ? <p className="rounded-2xl border border-dashed border-[#badbd2] p-5 text-[#6a827d]">No synchronized appointment requests yet.</p> : <div className="space-y-3">{items.map(item=><article key={item.id} className="rounded-2xl bg-[#f4faf8] p-4"><div className="flex items-center justify-between gap-4"><h3 className="font-bold">{item.patient_alias}</h3><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0a9b7a]">{item.status}</span></div><p className="mt-2 text-sm capitalize text-[#53716b]">{item.care_type} · {new Date(item.scheduled_for).toLocaleString()}</p></article>)}</div>}</div>
    </div>}
    {!authenticated&&message&&<p role="status" className="pb-5 text-sm text-[#76500a]">{message}</p>}
  </div></section>;
}
