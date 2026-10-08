/**
 * 手帳のカバー。本人が、自分の画面で選ぶ。端末の中だけに保存し、サーバーには送らない。
 * 窓口に見せる画面・紙・窓口側の画面は、中立のデザインのまま（カバーは反映しない）。
 */
export const PRESETS = [
  { id: "wood", label: "木のぬくもり", css: "linear-gradient(135deg,#7a5a2f,#5b4222)" },
  { id: "sun", label: "午後の光", css: "linear-gradient(135deg,#8a5a1f,#6b4210)" },
  { id: "leaf", label: "若葉", css: "linear-gradient(135deg,#4f7a3c,#34562a)" },
  { id: "dusk", label: "夕空", css: "linear-gradient(135deg,#6a5a8c,#463c68)" },
  { id: "sumi", label: "墨", css: "linear-gradient(135deg,#4a4540,#2b2825)" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];
export type Cover = { kind: "preset"; id: PresetId } | { kind: "photo"; dataUrl: string };

export const MAX_PHOTO_CHARS = 700_000; // 約500KB。端末の保存領域を、使いすぎない

export function parseCover(raw: string | null): Cover | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Cover> & { id?: string; dataUrl?: string };
    if (v.kind === "preset" && PRESETS.some((p) => p.id === v.id)) return { kind: "preset", id: v.id as PresetId };
    if (v.kind === "photo" && typeof v.dataUrl === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v.dataUrl) && v.dataUrl.length <= MAX_PHOTO_CHARS) {
      return { kind: "photo", dataUrl: v.dataUrl };
    }
  } catch {
    /* 読めなければ、なし */
  }
  return null;
}

/** ヘッダーの背景。写真には、文字が読めるよう、暗い膜をかける。 */
export function coverBackground(c: Cover): { backgroundImage: string; backgroundSize?: string; backgroundPosition?: string } {
  if (c.kind === "preset") return { backgroundImage: PRESETS.find((p) => p.id === c.id)!.css };
  return {
    backgroundImage: `linear-gradient(rgba(30,22,10,.58),rgba(30,22,10,.58)),url(${c.dataUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
