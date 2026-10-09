import { describe, expect, it } from "vitest";
import { JP, MAX_ITEMS, validateTexts } from "./translate";

describe("翻訳の入力の確認", () => {
  it("日本語を含む、短い文字の並びだけ、受け付ける", () => {
    expect(validateTexts({ texts: ["手帳を作る", "はじめる"] })).toEqual(["手帳を作る", "はじめる"]);
    expect(validateTexts({ texts: ["English only"] })).toBeNull();
    expect(validateTexts({ texts: [] })).toBeNull();
    expect(validateTexts({ texts: ["あ".repeat(301)] })).toBeNull();
    expect(validateTexts({ texts: Array.from({ length: MAX_ITEMS + 1 }, () => "あ") })).toBeNull();
    expect(validateTexts({ texts: [1] })).toBeNull();
    expect(validateTexts(null)).toBeNull();
  });
  it("ひらがな・カタカナ・漢字を、日本語と判定する", () => {
    expect(JP.test("あ")).toBe(true);
    expect(JP.test("ア")).toBe(true);
    expect(JP.test("縁")).toBe(true);
    expect(JP.test("Engawa")).toBe(false);
  });
});
