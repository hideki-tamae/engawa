import { describe, expect, it } from "vitest";
import { canHandoff } from "./card";
import { sampleCard } from "./sample";

describe("サンプルの手帳（作り話）", () => {
  it("そのまま、引き継げる形（本人の確認つき）で、作り話だと分かる", () => {
    const c = sampleCard("sample-x");
    expect(canHandoff(c).ok).toBe(true);
    expect(c.statement).toContain("作り話");
    expect(c.id.startsWith("sample-")).toBe(true);
  });
  it("個人を特定する情報は、入っていない", () => {
    const text = JSON.stringify(sampleCard());
    expect(text).not.toMatch(/\d{2,4}-\d{2,4}-\d{3,4}|@|〒/);
  });
});
