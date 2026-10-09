import { logEvent } from "@/lib/log";
import { proofFor, share } from "@/lib/handoff";
import { allow, clientKey } from "@/lib/ratelimit";
import { sampleCard } from "@/lib/sample";
import { store } from "@/lib/store";
import { newOwnerToken, windowIdFor } from "@/lib/tokens";

/** サンプルの手帳（作り話）を、新しく作る。入力は、受け取らない。 */
export async function POST(request: Request) {
  if (!allow(`sample:${clientKey(request)}`, 12, 10 * 60_000)) {
    logEvent("rate_limited", { route: "sample" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const owner = newOwnerToken();
  const windowToken = windowIdFor(owner);
  const r = share(sampleCard(), windowToken);
  if (!r.ok) return Response.json({ error: r.reason }, { status: 500 });
  const h = { ...r.value, v: 2 as const };
  await store.put(h);
  logEvent("sample_created", {});
  return Response.json({ token: owner, windowToken, proof: proofFor(h) });
}
