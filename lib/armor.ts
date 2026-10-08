import { accessToken } from "./llm";

/**
 * Google Cloud Model Armor（AIの入口と出口の検問所）。
 * 「指示を無視して」などの攻撃文が、AIに渡る前・AIから返った後に混ざっていないかを調べる。
 * 本人が書いた言葉の保存は止めない。引っかかったときは、AIに渡さず、固定の質問に戻す。
 * 使えないとき（未設定・通信失敗・時間切れ）は "unavailable" を返し、自前のガードレールだけで動く。
 */
export type ArmorVerdict = "ok" | "flagged" | "unavailable";
export interface Guard {
  prompt(text: string): Promise<ArmorVerdict>;
  response(text: string): Promise<ArmorVerdict>;
}

type Fetch = typeof fetch;

async function sanitize(template: string, kind: "prompt" | "response", text: string, doFetch: Fetch, getToken: () => Promise<string>): Promise<ArmorVerdict> {
  const m = template.match(/\/locations\/([a-z0-9-]+)\//);
  if (!m || !text.trim()) return "unavailable";
  try {
    const token = await getToken();
    const res = await doFetch(
      `https://modelarmor.${m[1]}.rep.googleapis.com/v1/${template}:${kind === "prompt" ? "sanitizeUserPrompt" : "sanitizeModelResponse"}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(kind === "prompt" ? { userPromptData: { text } } : { modelResponseData: { text } }),
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!res.ok) return "unavailable";
    const j = (await res.json()) as { sanitizationResult?: { filterMatchState?: string } };
    const s = j.sanitizationResult?.filterMatchState;
    return s === "MATCH_FOUND" ? "flagged" : s === "NO_MATCH_FOUND" ? "ok" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export function makeGuard(template: string, doFetch: Fetch = fetch, getToken: () => Promise<string> = accessToken): Guard {
  return {
    prompt: (t) => sanitize(template, "prompt", t, doFetch, getToken),
    response: (t) => sanitize(template, "response", t, doFetch, getToken),
  };
}

/** ARMOR_TEMPLATE（例: projects/…/locations/asia-northeast1/templates/engawa-guard）があるときだけ有効。 */
export function pickGuard(): Guard | null {
  const t = process.env.ARMOR_TEMPLATE;
  return t ? makeGuard(t) : null;
}
