import { verifyPaper } from "@/lib/handoff";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";
import { store } from "@/lib/store";

/** 紙の照合。ログイン不要。返すのは「一致するか」と作成日時だけ（内容は返さない）。 */
export async function GET(request: Request, ctx: RouteContext<"/api/cards/[token]/verify">) {
  if (!allow(`verify:${clientKey(request)}`, LIMITS.cards.limit * 3, LIMITS.cards.windowMs)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const { token } = await ctx.params;
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const h = await store.get(token);
  if (!h || code.length === 0) return Response.json({ match: false, reason: "mismatch" });
  return Response.json(verifyPaper(h, code));
}
