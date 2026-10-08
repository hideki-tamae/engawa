import { accessToken } from "@/lib/llm";
import { logEvent } from "@/lib/log";
import { allow, clientKey } from "@/lib/ratelimit";

/**
 * 話して入力：音声を文字に直すだけ（Google Cloud Speech-to-Text）。
 * 音声は保存しない。声から、気持ちや状態を推測することもしない。
 */
const MAX_BASE64 = 3_000_000; // 16kHz・16bit なら、約90秒ぶんの上限
const MIN_BASE64 = 4_000; // 約0.1秒より短いものは、受け付けない

export async function POST(request: Request) {
  if (!allow(`stt:${clientKey(request)}`, 12, 60_000)) {
    logEvent("rate_limited", { route: "stt" }, "WARNING");
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BASE64 + 100) return Response.json({ error: "too_large" }, { status: 413 });
  let audio: unknown;
  try {
    audio = (JSON.parse(raw) as { audio?: unknown }).audio;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof audio !== "string" || audio.length < MIN_BASE64 || audio.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(audio)) {
    return Response.json({ error: "invalid" }, { status: 422 });
  }
  try {
    const token = await accessToken();
    const headers: Record<string, string> = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    if (process.env.VERTEX_PROJECT) headers["x-goog-user-project"] = process.env.VERTEX_PROJECT;
    const t0 = Date.now();
    const res = await fetch("https://speech.googleapis.com/v1/speech:recognize", {
      method: "POST",
      headers,
      body: JSON.stringify({
        config: {
          languageCode: "ja-JP",
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          enableAutomaticPunctuation: true,
          model: "latest_long",
        },
        audio: { content: audio },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      logEvent("stt_call", { ok: false, status: res.status, latency_ms: Date.now() - t0 }, "WARNING");
      return Response.json({ error: "stt_failed" }, { status: 502 });
    }
    const j = (await res.json()) as { results?: { alternatives?: { transcript?: string }[] }[]; totalBilledTime?: string };
    const text = (j.results ?? []).map((r) => r.alternatives?.[0]?.transcript ?? "").join("");
    logEvent("stt_call", { ok: true, empty: text.length === 0, billed: j.totalBilledTime ?? "", latency_ms: Date.now() - t0 });
    return Response.json({ text });
  } catch {
    logEvent("stt_call", { ok: false, status: 0 }, "WARNING");
    return Response.json({ error: "stt_failed" }, { status: 502 });
  }
}
