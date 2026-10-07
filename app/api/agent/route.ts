import type { ProblemCard } from "@/lib/card";
import { geminiGenerate, proposeNext } from "@/lib/agent";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!allow(`agent:${clientKey(request)}`, LIMITS.agent.limit, LIMITS.agent.windowMs)) {
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
  const key = process.env.GEMINI_API_KEY;
  const proposal = await proposeNext(card, key ? geminiGenerate(key) : null);
  return Response.json({ proposal });
}
