/**
 * 基本情報（任意）。窓口で毎回書かされる、名前・住所・電話などを、本人がこの端末に残しておく。
 * サーバーには送らない・保存しない。見せるかどうかは、見せる画面で本人が選ぶ。
 * 身分証の画像や、マイナンバーなどの番号は、扱わない。
 */
export const PROFILE_FIELDS = [
  { key: "name", label: "お名前", max: 40 },
  { key: "kana", label: "ふりがな", max: 60 },
  { key: "birth", label: "生年月日", max: 20 },
  { key: "address", label: "住所", max: 120 },
  { key: "phone", label: "電話番号", max: 20 },
] as const;
export type ProfileKey = (typeof PROFILE_FIELDS)[number]["key"];
export type Profile = Partial<Record<ProfileKey, string>>;

/** 12桁以上の数字の並び（マイナンバーなど）。ハイフンや空白は無視して調べる。 */
function hasLongNumber(s: string): boolean {
  return /\d{12,}/.test(s.replace(/[\s\-ー－]/g, ""));
}

export function validateProfile(input: unknown): { ok: true; value: Profile } | { ok: false; reason: "invalid" | "id_number" } {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "invalid" };
  const o = input as Record<string, unknown>;
  const value: Profile = {};
  for (const f of PROFILE_FIELDS) {
    const v = o[f.key];
    if (v === undefined || v === "") continue;
    if (typeof v !== "string") return { ok: false, reason: "invalid" };
    const t = v.trim().slice(0, f.max);
    if (!t) continue;
    if (hasLongNumber(t)) return { ok: false, reason: "id_number" };
    value[f.key] = t;
  }
  return { ok: true, value };
}

export function parseProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const r = validateProfile(JSON.parse(raw));
    return r.ok && Object.keys(r.value).length > 0 ? r.value : null;
  } catch {
    return null;
  }
}
