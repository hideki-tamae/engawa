import { verifyChain } from "@/lib/audit-chain";
import { handOff, open, recordReadBack, withdraw } from "@/lib/handoff";
import { SESSION_COOKIE, verify } from "@/lib/session";
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
  const h = await store.get(token);
  if (!h) return Response.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json()) as { action: string; to?: string };
  // 取り下げは、カードを持つ本人の操作。それ以外は、ログインした窓口の操作。
  if (body.action !== "withdraw" && !windowUser(request)) {
    return Response.json({ error: "login_required" }, { status: 401 });
  }
  let next;
  if (body.action === "confirmed" || body.action === "corrected") {
    next = recordReadBack(h, body.action);
  } else if (body.action === "handoff") {
    next = handOff(h, body.to ?? "次の窓口");
  } else if (body.action === "withdraw") {
    next = { ok: true as const, value: withdraw(h) };
  } else {
    return Response.json({ error: "unknown_action" }, { status: 400 });
  }
  if (!next.ok) return Response.json({ error: next.reason }, { status: 409 });
  await store.put(next.value);
  return Response.json({ log: next.value.log, chain: verifyChain(next.value.log) });
}
