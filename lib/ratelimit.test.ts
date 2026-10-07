import { describe, expect, it } from "vitest";
import { allow } from "./ratelimit";

describe("allow", () => {
  it("上限を超えたら拒否し、窓が過ぎたら戻る", () => {
    const k = "t1";
    expect(allow(k, 2, 1000, 0)).toBe(true);
    expect(allow(k, 2, 1000, 1)).toBe(true);
    expect(allow(k, 2, 1000, 2)).toBe(false);
    expect(allow(k, 2, 1000, 1001)).toBe(true);
  });
  it("キーごとに独立", () => {
    expect(allow("a", 1, 1000, 0)).toBe(true);
    expect(allow("b", 1, 1000, 0)).toBe(true);
  });
});
