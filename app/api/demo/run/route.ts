import { pickGenerate } from "@/lib/llm";
import { runScenario } from "@/lib/demo";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";

/** 「仕組みを見る」。作り話の例で、実際のしくみを動かして結果を返す。個人情報は扱わない。 */
export async function GET(request: Request) {
  if (!allow(`demo:${clientKey(request)}`, LIMITS.agent.limit, LIMITS.agent.windowMs)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const steps = await runScenario(pickGenerate());
  return Response.json({ steps });
}
