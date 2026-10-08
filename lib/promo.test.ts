import { describe, expect, it } from "vitest";
import { CODE_PATTERN, INVITE_OFFER, newInviteCode, normalizeCode } from "./promo";

describe("招待コード", () => {
  it("決まった形で、毎回ちがうコードができる", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const c = newInviteCode();
      expect(CODE_PATTERN.test(c)).toBe(true);
      seen.add(c);
    }
    expect(seen.size).toBeGreaterThan(190);
  });
  it("読み間違えやすい文字（0 O 1 I L）は、使わない", () => {
    for (let i = 0; i < 200; i++) expect(newInviteCode().slice(3)).not.toMatch(/[01OIL]/);
  });
  it("全角・小文字・前後の空白があっても、そろえて受け取る", () => {
    expect(normalizeCode(" en-ab23-cd45 ")).toBe("EN-AB23-CD45");
    expect(normalizeCode("ＥＮ－ＡＢ２３－ＣＤ４５")).toBe("EN-AB23-CD45");
  });
  it("形が違うものは、受け取らない", () => {
    expect(normalizeCode("EN-AB23")).toBeNull();
    expect(normalizeCode("XX-AB23-CD45")).toBeNull();
    expect(normalizeCode("EN-AB01-CD45")).toBeNull();
    expect(normalizeCode(123)).toBeNull();
  });
  it("特典は、金額や先着などの、実際にはないものを約束しない", () => {
    const text = JSON.stringify(INVITE_OFFER);
    expect(text).not.toMatch(/先着|限定|残り|割引|円|%|％|キャッシュ/);
  });
});
