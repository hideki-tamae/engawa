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

/** カバーの縦横比（横:縦）。写真は、この形に切り出してから保存する。 */
export const COVER_ASPECT = 3;
export const COVER_W = 900;
export const COVER_H = COVER_W / COVER_ASPECT;

/**
 * 写真のどの部分を、カバーの形に切り出すか。
 * x, y は 0〜1（左右・上下の位置）、zoom は 1〜3（大きいほど、拡大）。
 */
export function cropRect(imgW: number, imgH: number, x: number, y: number, zoom: number, aspect = COVER_ASPECT) {
  const w0 = imgW / imgH >= aspect ? imgH * aspect : imgW;
  const h0 = w0 / aspect;
  const z = Math.min(3, Math.max(1, zoom));
  const sw = w0 / z;
  const sh = h0 / z;
  const cx = Math.min(1, Math.max(0, x));
  const cy = Math.min(1, Math.max(0, y));
  return { sx: (imgW - sw) * cx, sy: (imgH - sh) * cy, sw, sh };
}
