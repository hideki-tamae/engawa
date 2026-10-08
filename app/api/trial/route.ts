import { addDoc } from "@/lib/collect";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { validateTrial } from "@/lib/trial";

export async function POST(request: Request) {
  if (!allow(`trial:${clientKey(request)}`, 120, 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const text = await request.text();
  if (text.length > LIMITS.bodyMaxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validateTrial(body);
  if (!v.ok) return Response.json({ error: "invalid" }, { status: 422 });
  await addDoc("trial", { ...v.value, at: new Date().toISOString() });
  return Response.json({ ok: true });
}
