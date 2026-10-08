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
