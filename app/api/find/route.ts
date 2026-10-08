import { fetchOfficialPage, findWindows, validateInput } from "@/lib/finder";
import { pickGroundedWithSources } from "@/lib/llm";
import { logEvent } from "@/lib/log";
import { allow, clientKey } from "@/lib/ratelimit";

/**
 * 次の相談先の候補を探す。使うのは、本人が選んだ「困りごとの種類」と、任意の市区町村だけ。
 * 本人の言葉は、受け取らない。候補は、本人が選ぶまで、保存も共有もしない。
 */
export async function POST(request: Request) {
  if (!allow(`find:${clientKey(request)}`, 6, 60_000)) {
    logEvent("rate_limited", { route: "find" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > 2_000) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validateInput(body);
  if (!v.ok) return Response.json({ error: "invalid" }, { status: 422 });

  const t0 = Date.now();
  const out = await findWindows(v.value, { generate: null, generateGrounded: pickGroundedWithSources(), fetchPage: fetchOfficialPage });
  if (!out.ok) {
    logEvent("find_windows", { ok: false, reason: out.reason, latency_ms: Date.now() - t0 }, "WARNING");
    return Response.json({ error: out.reason }, { status: out.reason === "no_model" ? 503 : 502 });
  }
  const verified = out.candidates.filter((c) => c.verified).length;
  logEvent("find_windows", {
    ok: true,
    proposed: out.candidates.length,
    verified,
    unverified: out.candidates.length - verified,
    reasons: out.candidates.filter((c) => !c.verified).map((c) => c.reason ?? "unknown"),
    statuses: out.candidates.filter((c) => !c.verified).map((c) => String(c.status ?? "")),
    has_area: Boolean(v.value.area),
    latency_ms: Date.now() - t0,
  }, verified === 0 ? "WARNING" : "INFO");
  return Response.json({
    checkedAt: out.checkedAt,
    candidates: out.candidates.map(({ name, kind, what, url, verified, searchUrl }) => ({ name, kind, what, url, verified, searchUrl })),
  });
}
