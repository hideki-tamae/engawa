import { randomBytes } from "node:crypto";
import type { ProblemCard } from "@/lib/card";
import { screenInput } from "@/lib/guardrails";
import { proofFor, share } from "@/lib/handoff";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  if (!allow(`cards:${clientKey(request)}`, LIMITS.cards.limit, LIMITS.cards.windowMs)) {
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
  if (screened.verdict === "refuse") {
    return Response.json({ error: "guardrail", reasons: screened.reasons }, { status: 422 });
  }
  const token = randomBytes(16).toString("hex");
  const r = share(card, token);
  if (!r.ok) return Response.json({ error: r.reason }, { status: 422 });
  await store.put(r.value);
  return Response.json({ token, proof: proofFor(r.value) });
}
