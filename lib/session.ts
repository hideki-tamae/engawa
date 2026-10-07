import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 窓口のログイン（デモ用アカウント）。ソーシャルログインは使わない。
 * Cookie は「ユーザー名.期限.署名」。署名は HMAC-SHA256。本人（カードの持ち主）のリンクは別物で、ここでは扱わない。
 */
export const SESSION_COOKIE = "engawa_window";
const TTL_MS = 8 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issue(user: string, now = Date.now()): string {
  const payload = `${encodeURIComponent(user)}.${now + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verify(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [user, exp] = payload.split(".");
  if (!user || Number(exp) < now) return null;
  return decodeURIComponent(user);
}

/** WINDOW_ACCOUNTS="窓口A:pass1,窓口B:pass2" */
export function checkLogin(user: string, password: string): boolean {
  const raw = process.env.WINDOW_ACCOUNTS ?? "";
  for (const pair of raw.split(",")) {
    const j = pair.indexOf(":");
    if (j < 0) continue;
    const u = pair.slice(0, j).trim();
    const p = pair.slice(j + 1);
    if (u === user) {
      const a = Buffer.from(p);
      const b = Buffer.from(password);
      return a.length === b.length && timingSafeEqual(a, b);
    }
  }
  return false;
}
