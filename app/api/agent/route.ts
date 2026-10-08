import type { ProblemCard } from "@/lib/card";
import { proposeNext } from "@/lib/agent";
import { pickGenerate } from "@/lib/llm";
import { logEvent } from "@/lib/log";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!allow(`agent:${clientKey(request)}`, LIMITS.agent.limit, LIMITS.agent.windowMs)) {
    logEvent("rate_limited", { route: "agent" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > LIMITS.bodyMaxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  let card: ProblemCard;
  try {
    card = JSON.parse(text) as ProblemCard;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof card.statement !== "string" || card.statement.length > LIMITS.statementMax) {
    return Response.json({ error: "statement_invalid" }, { status: 422 });
  }
  const t0 = Date.now();
  const proposal = await proposeNext(card, pickGenerate());
  logEvent("agent_proposal", {
    source: proposal?.source ?? "none",
    field: proposal?.field ?? "none",
    suggestions: proposal?.suggestions.length ?? 0,
    dropped: proposal?.dropped ?? 0,
    latency_ms: Date.now() - t0,
  }, proposal?.source === "fallback" ? "WARNING" : "INFO");
  return Response.json({ proposal });
}
