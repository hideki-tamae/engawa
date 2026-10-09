import { verifyChain } from "@/lib/audit-chain";
import { handOff, open, recordReadBack, withdraw } from "@/lib/handoff";
import { logEvent } from "@/lib/log";
import { SESSION_COOKIE, verify } from "@/lib/session";
import { ownerHandoff } from "@/lib/owner";
import { store } from "@/lib/store";

function windowUser(request: Request): string | null {
  const m = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  return verify(m?.[1]);
}

export async function GET(request: Request, ctx: RouteContext<"/api/cards/[token]">) {
  const user = windowUser(request);
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  const { token } = await ctx.params;
  const h = await store.get(token);
  if (!h) return Response.json({ error: "not_found" }, { status: 404 });
  const o = open(h, user);
  if (!o.ok) return Response.json({ error: o.reason }, { status: 410 });
  await store.put(o.value.handoff);
  return Response.json({
    view: o.value.view,
    log: o.value.handoff.log,
    chain: verifyChain(o.value.handoff.log),
  });
}

/** action: confirmed | corrected | handoff | withdraw */
export async function POST(request: Request, ctx: RouteContext<"/api/cards/[token]">) {
  const { token } = await ctx.params;
  let body: { action: string; to?: string };
  try {
    body = (await request.json()) as { action: string; to?: string };
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || typeof body.action !== "string") {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  // 取り下げは、本人用の合鍵だけ。ほかは、窓口用の合鍵で、ログインした窓口の操作。
  const isWithdraw = body.action === "withdraw";
  if (!isWithdraw && !windowUser(request)) {
    return Response.json({ error: "login_required" }, { status: 401 });
  }
  const h = isWithdraw ? await ownerHandoff(token) : await store.get(token);
  if (!h) return Response.json({ error: "not_found" }, { status: 404 });
  let next;
  if (body.action === "confirmed" || body.action === "corrected") {
    next = recordReadBack(h, body.action);
  } else if (body.action === "handoff") {
    next = handOff(h, body.to ?? "次の窓口");
  } else if (isWithdraw) {
    next = { ok: true as const, value: withdraw(h) };
  } else {
    return Response.json({ error: "unknown_action" }, { status: 400 });
  }
  if (!next.ok) {
    logEvent("card_action_refused", { action: body.action, reason: next.reason }, "NOTICE");
    return Response.json({ error: next.reason }, { status: 409 });
  }
  logEvent("card_action", { action: body.action });
  await store.put(next.value);
  return Response.json({ log: next.value.log, chain: verifyChain(next.value.log) });
}
