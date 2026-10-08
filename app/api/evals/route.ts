import { runDeterministicEvals } from "@/lib/evals";
import { allow, clientKey } from "@/lib/ratelimit";

/** 決まった入力での、制御のテスト結果。費用はかからない。 */
export async function GET(request: Request) {
  if (!allow(`evals:${clientKey(request)}`, 30, 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const report = await runDeterministicEvals();
  return Response.json(report, { headers: { "cache-control": "no-store" } });
}
