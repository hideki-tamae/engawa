import { addDoc } from "@/lib/collect";
import { screenInput } from "@/lib/guardrails";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { validateRating } from "@/lib/trial";

export async function POST(request: Request) {
  if (!allow(`rate:${clientKey(request)}`, 10, 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const text = await request.text();
  if (text.length > LIMITS.bodyMaxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validateRating(body);
  if (!v.ok) return Response.json({ error: "invalid" }, { status: 422 });
  // 自由記述に、個人が特定される情報が入っていたら、受け取らない
  for (const t of [v.value.best, v.value.worst]) {
    if (t && screenInput(t).verdict === "refuse") return Response.json({ error: "pii" }, { status: 422 });
  }
  await addDoc("ratings", { ...v.value, at: new Date().toISOString() });
  return Response.json({ ok: true });
}
