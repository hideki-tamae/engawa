import { runLiveEvals } from "@/lib/evals";
import { pickGenerate } from "@/lib/llm";
import { logEvent } from "@/lib/log";
import { allow, clientKey } from "@/lib/ratelimit";

/** 実際の AI で、12件を試す。費用を抑えるため、回数を絞り、結果を30分、使い回す。 */
const g = globalThis as unknown as { __liveEvals?: { at: number; body: unknown } };

export async function POST(request: Request) {
  const cached = g.__liveEvals;
  if (cached && Date.now() - cached.at < 30 * 60_000) {
    return Response.json({ ...(cached.body as object), cached: true, ageMinutes: Math.round((Date.now() - cached.at) / 60_000) });
  }
  if (!allow(`evals-live:${clientKey(request)}`, 2, 10 * 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const generate = pickGenerate();
  if (!generate) return Response.json({ error: "no_model" }, { status: 503 });
  const t0 = Date.now();
  const out = await runLiveEvals(generate);
  const body = { ...out, at: new Date().toISOString() };
  g.__liveEvals = { at: Date.now(), body };
  logEvent("evals_live", { total: out.total, adopted: out.adopted, passed: out.report.passed, avg_ms: out.avgMs, latency_ms: Date.now() - t0 });
  return Response.json(body);
}
