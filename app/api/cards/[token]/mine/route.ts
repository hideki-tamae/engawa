import { verifyChain } from "@/lib/audit-chain";
import { viewFor } from "@/lib/handoff";
import { store } from "@/lib/store";

/** カードの持ち主（リンクを持つ本人）が、自分のカードと経過を見る。窓口の「開いた」記録は増やさない。 */
export async function GET(_request: Request, ctx: RouteContext<"/api/cards/[token]/mine">) {
  const { token } = await ctx.params;
  const h = await store.get(token);
  if (!h) return Response.json({ error: "not_found" }, { status: 404 });
  // 取り下げたあとは、リンクを知っている人にも、内容を返さない
  return Response.json({
    withdrawn: h.withdrawn,
    view: h.withdrawn ? null : viewFor(h.card),
    log: h.log,
    chain: verifyChain(h.log),
  });
}
