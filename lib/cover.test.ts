import { describe, expect, it } from "vitest";
import { MAX_PHOTO_CHARS, coverBackground, parseCover } from "./cover";

describe("カバー", () => {
  it("決められた色と、画像だけを受け付ける", () => {
    expect(parseCover(JSON.stringify({ kind: "preset", id: "leaf" }))).toEqual({ kind: "preset", id: "leaf" });
    expect(parseCover(JSON.stringify({ kind: "preset", id: "evil" }))).toBeNull();
    expect(parseCover(JSON.stringify({ kind: "photo", dataUrl: "data:image/jpeg;base64,AAAA" }))?.kind).toBe("photo");
    expect(parseCover(JSON.stringify({ kind: "photo", dataUrl: "javascript:alert(1)" }))).toBeNull();
    expect(parseCover(JSON.stringify({ kind: "photo", dataUrl: "https://example.com/x.png" }))).toBeNull();
    expect(parseCover(JSON.stringify({ kind: "photo", dataUrl: "data:image/jpeg;base64," + "A".repeat(MAX_PHOTO_CHARS) }))).toBeNull();
    expect(parseCover("not json")).toBeNull();
    expect(parseCover(null)).toBeNull();
  });
  it("写真には暗い膜がかかる（文字が読める）", () => {
    const bg = coverBackground({ kind: "photo", dataUrl: "data:image/jpeg;base64,AAAA" });
    expect(bg.backgroundImage.startsWith("linear-gradient(rgba(")).toBe(true);
  });
});

import { COVER_ASPECT, cropRect } from "./cover";

describe("写真の切り出し", () => {
  it("縦長の写真でも、横長の枠に、切り出せる（縦横比は、枠のとおり）", () => {
    const r = cropRect(1000, 3000, 0.5, 0.5, 1);
    expect(r.sw / r.sh).toBeCloseTo(COVER_ASPECT, 5);
    expect(r.sx).toBeGreaterThanOrEqual(0);
    expect(r.sy + r.sh).toBeLessThanOrEqual(3000 + 1e-6);
  });
  it("位置は、写真の外に出ない。拡大すると、範囲が小さくなる", () => {
    const a = cropRect(4000, 3000, 1, 1, 1);
    const b = cropRect(4000, 3000, 1, 1, 2);
    expect(a.sx + a.sw).toBeLessThanOrEqual(4000 + 1e-6);
    expect(a.sy + a.sh).toBeLessThanOrEqual(3000 + 1e-6);
    expect(b.sw).toBeCloseTo(a.sw / 2, 5);
    const z = cropRect(4000, 3000, -5, 9, 99);
    expect(z.sx).toBeGreaterThanOrEqual(0);
    expect(z.sy + z.sh).toBeLessThanOrEqual(3000 + 1e-6);
  });
});
