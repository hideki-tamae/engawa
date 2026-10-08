import { getDocById, putDocById } from "@/lib/collect";
import { logEvent } from "@/lib/log";
import { INVITE_OFFER, type InviteDoc, newInviteCode } from "@/lib/promo";
import { allow, clientKey } from "@/lib/ratelimit";
import { SESSION_COOKIE, verify } from "@/lib/session";

/** ログインした窓口が、次の窓口に渡す招待コードをつくる。 */
export async function POST(request: Request) {
  const m = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  const user = verify(m?.[1]);
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  if (!allow(`invite:${clientKey(request)}`, 5, 10 * 60_000)) {
    logEvent("rate_limited", { route: "invite" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  let code = newInviteCode();
  for (let i = 0; i < 3 && (await getDocById("invites", code)); i++) code = newInviteCode();
  const doc: InviteDoc = { code, by: user.slice(0, 40), createdAt: new Date().toISOString(), redeemed: 0 };
  await putDocById("invites", code, doc as unknown as Record<string, unknown>);
  logEvent("invite_issued", {});
  return Response.json({ code, offer: INVITE_OFFER });
}
