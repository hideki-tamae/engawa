import { createHmac, randomBytes } from "node:crypto";

/**
 * 手帳には、2種類の合鍵がある。
 *  - 本人用（owner）: 本人の端末だけが持つ。自分の手帳を見る・取り下げる・見せる画面を開く。
 *  - 窓口用（window）: 窓口に渡す。ログインしたうえで、読む・本人の確認を記録する・引き継ぐ。取り下げは、できない。
 * 窓口用は、本人用から、サーバーの秘密の鍵で作る（逆向きには、たどれない）。保存の ID は、窓口用。
 */
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not set");
  return s;
}

export const newOwnerToken = (): string => randomBytes(16).toString("hex");

export function windowIdFor(owner: string): string {
  return createHmac("sha256", secret()).update(`window:${owner}`).digest("hex").slice(0, 32);
}
