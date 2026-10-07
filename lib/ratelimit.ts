/**
 * 回数制限（固定窓）。Gemini の費用と乱用を抑える。
 * メモリ上のため、インスタンスごとの制限になる。Cloud Run は最大インスタンス数を絞って運用する。
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const cur = hits.get(key);
  if (!cur || cur.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count++;
  return true;
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || "local";
}

export const LIMITS = {
  agent: { limit: 20, windowMs: 60_000 },
  cards: { limit: 10, windowMs: 60_000 },
  /** 本文の上限（文字数）。長すぎる入力はモデルに渡さない */
  statementMax: 2000,
  bodyMaxBytes: 20_000,
} as const;
