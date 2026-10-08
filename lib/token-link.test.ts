import { describe, expect, it } from "vitest";
import { extractToken } from "./token-link";

describe("リンクから手帳のトークンを取り出す", () => {
  it("窓口・見せる・手帳のリンクから、取り出せる", () => {
    expect(extractToken("https://example.run.app/window/abcDEF123_-xyz")).toBe("abcDEF123_-xyz");
    expect(extractToken(" https://example.run.app/show/abcDEF123456 ")).toBe("abcDEF123456");
    expect(extractToken("/card/abcDEF123456")).toBe("abcDEF123456");
  });
  it("トークンだけでも、よい", () => {
    expect(extractToken("abcDEF123456")).toBe("abcDEF123456");
  });
  it("関係ない文字は、受け付けない", () => {
    expect(extractToken("こんにちは")).toBeNull();
    expect(extractToken("https://example.com/other")).toBeNull();
    expect(extractToken("abc")).toBeNull();
  });
});
