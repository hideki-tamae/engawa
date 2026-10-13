import { logEvent } from "@/lib/log";
import { allow, clientKey } from "@/lib/ratelimit";

/**
 * 話して入力が使えなかった「理由の種類」だけを、記録する（声・文字・個人を特定する情報は、受け取らない）。
 * 端末ごとの不具合の原因をつかむため。
 */
const REASONS = ["no_data", "silent", "decode_fail", "stt_fail", "permission", "no_mic", "mic_error"] as const;

export async function POST(request: Request) {
  if (!allow(`vr:${clientKey(request)}`, 20, 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  let reason: unknown;
  try {
    reason = (JSON.parse(await request.text()) as { reason?: unknown }).reason;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof reason !== "string" || !(REASONS as readonly string[]).includes(reason)) return Response.json({ error: "invalid" }, { status: 422 });
  logEvent("voice_client_error", { reason });
  return Response.json({ ok: true });
}
