import { addDoc, getDocById, putDocById } from "@/lib/collect";
import { INVITE_OFFER, type InviteDoc } from "@/lib/promo";
import { logEvent } from "@/lib/log";
import { validatePilot } from "@/lib/pilot";
import { LIMITS, allow, clientKey } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!allow(`pilot:${clientKey(request)}`, 5, 10 * 60_000)) {
    logEvent("rate_limited", { route: "pilot" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > LIMITS.bodyMaxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validatePilot(body);
  if (!v.ok) return Response.json({ error: v.reason }, { status: 422 });
  // 招待コードがあれば、本物かを確かめる。使った回数も数える。違っていても、申し込み自体は受け付ける
  let invite: InviteDoc | null = null;
  if (v.value.code) {
    invite = await getDocById<InviteDoc>("invites", v.value.code);
    if (invite) await putDocById("invites", v.value.code, { ...invite, redeemed: (invite.redeemed ?? 0) + 1 } as unknown as Record<string, unknown>);
  }
  await addDoc("pilots", { ...v.value, invitedBy: invite?.by ?? null, codeValid: v.value.code ? !!invite : null, at: new Date().toISOString() });
  logEvent("pilot_request", { kind: v.value.kind, invited: !!invite, code_given: !!v.value.code });
  return Response.json({ ok: true, invited: !!invite, offer: invite ? INVITE_OFFER : null, codeGivenButUnknown: !!v.value.code && !invite });
}
