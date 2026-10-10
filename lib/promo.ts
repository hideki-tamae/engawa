import { randomBytes } from "node:crypto";

/**
 * 招待コード。窓口が、次の窓口に渡す。受け取った窓口は、コードを添えてパイロットに申し込める。
 * 特典の中身は、ここ1か所で決める（画面は、これを読む）。実際に提供できることだけを書く。
 */
export const INVITE_OFFER = {
  title: "招待コードをお持ちの窓口へ",
  items: [
    "試行期間中の利用料は、かかりません。",
    "導入の初期設定を、運営が無料で代行します。",
    "試行の結果（カード作成にかかった時間、引き継ぎを受け取れた割合など）を、まとめたレポートを無料でお渡しします。",
  ],
  note: "課金はまだありません。特典は試行中のみ。",
} as const;

// 読み間違えやすい文字（0/O、1/I/L）は使わない
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_PATTERN = /^EN-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

export function newInviteCode(): string {
  const b = randomBytes(8);
  const ch = (i: number) => ALPHABET[b[i] % ALPHABET.length];
  return `EN-${ch(0)}${ch(1)}${ch(2)}${ch(3)}-${ch(4)}${ch(5)}${ch(6)}${ch(7)}`;
}

/** 入力されたコードを、大文字・半角にそろえる。形が合わなければ null。 */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const c = input.normalize("NFKC").trim().toUpperCase();
  return CODE_PATTERN.test(c) ? c : null;
}

export interface InviteDoc {
  code: string;
  by: string;
  createdAt: string;
  redeemed: number;
}
