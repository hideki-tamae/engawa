import type { ProblemCard } from "@/lib/card";
import { screenInput } from "@/lib/guardrails";
import { proofFor, share } from "@/lib/handoff";
import { logEvent } from "@/lib/log";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { store } from "@/lib/store";
import { newOwnerToken, windowIdFor } from "@/lib/tokens";

export async function POST(request: Request) {
  if (!allow(`cards:${clientKey(request)}`, LIMITS.cards.limit, LIMITS.cards.windowMs)) {
    logEvent("rate_limited", { route: "cards" }, "WARNING");
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
  const screened = screenInput(card.statement ?? "");
  if (screened.verdict !== "allow") {
    logEvent("guardrail_input", { verdict: screened.verdict, reasons: screened.reasons }, screened.verdict === "refuse" ? "WARNING" : "NOTICE");
  }
  if (screened.verdict === "refuse") {
    return Response.json({ error: "guardrail", reasons: screened.reasons }, { status: 422 });
  }
  const owner = newOwnerToken(); // 本人用の合鍵
  const windowToken = windowIdFor(owner); // 窓口用の合鍵（保存のIDも、これ）
  const r = share(card, windowToken);
  if (!r.ok) return Response.json({ error: r.reason }, { status: 422 });
  const h = { ...r.value, v: 2 as const };
  await store.put(h);
  logEvent("card_shared", { fields: card.shareScope.length });
  return Response.json({ token: owner, windowToken, proof: proofFor(h) });
}
