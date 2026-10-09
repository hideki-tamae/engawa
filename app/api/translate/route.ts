import { logEvent } from "@/lib/log";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { translateTexts, validateShort, validateTexts } from "@/lib/translate";

export async function POST(request: Request) {
  if (!allow(`translate:${clientKey(request)}`, 40, 60_000)) {
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
  const texts = validateTexts(body);
  if (!texts) return Response.json({ error: "invalid" }, { status: 422 });
  const out = await translateTexts(texts, validateShort(body));
  logEvent("translate", { n: texts.length });
  return Response.json({ translations: out });
}
