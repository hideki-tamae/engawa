import { addDoc } from "@/lib/collect";
import { logEvent } from "@/lib/log";
import { validatePilot } from "@/lib/pilot";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!allow(`pilot:${clientKey(request)}`, 5, 10 * 60_000)) {
    logEvent("rate_limited", { route: "pilot" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > LIMITS.bodyMaxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validatePilot(body);
  if (!v.ok) return Response.json({ error: v.reason }, { status: 422 });
  await addDoc("pilots", { ...v.value, at: new Date().toISOString() });
  logEvent("pilot_request", { kind: v.value.kind });
  return Response.json({ ok: true });
}
