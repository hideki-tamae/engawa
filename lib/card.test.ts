import { describe, expect, it } from "vitest";
import {
  canHandoff,
  confirmCard,
  confirmField,
  createCard,
  isMinimumViable,
  missingFields,
  setField,
  setShareScope,
} from "./card";
import { screenRequest } from "./guardrails";
import {
  COMMON_OPTIONS,
  confirmPrompt,
  followUpQuestions,
  validateSuggestion,
} from "./suggestions";

const STATEMENT = "仕事で困っていることを、うまく伝えられなくて、転職を繰り返しています。";

describe("card", () => {
  it("1文でも成立する。空は成立しない", () => {
    expect(isMinimumViable(createCard("c1", STATEMENT, "text"))).toBe(true);
    expect(isMinimumViable(createCard("c2", "   ", "voice"))).toBe(false);
  });

  it("全項目が埋まっていなくても、本人が選んで確認すれば引き継げる", () => {
    let c = createCard("c1", STATEMENT, "text_and_voice");
    expect(missingFields(c)).toHaveLength(4);
    c = setShareScope(c, ["what"]);
    c = confirmCard(c);
    expect(canHandoff(c)).toEqual({ ok: true, blockers: [] });
  });

  it("共有範囲が空、または本人が未確認なら、引き継げない", () => {
    let c = createCard("c1", STATEMENT, "text");
    expect(canHandoff(c).blockers).toEqual(
      expect.arrayContaining(["no_share_scope", "person_not_confirmed"]),
    );
    c = setShareScope(c, ["what"]);
    expect(canHandoff(c).blockers).toEqual(["person_not_confirmed"]);
  });

  it("内容が変わったら、確認がやり直しになる", () => {
    let c = setShareScope(createCard("c1", STATEMENT, "text"), ["what"]);
    c = confirmCard(c);
    expect(canHandoff(c).ok).toBe(true);
    c = setField(c, "help", "話を聞いてほしい", "chosen_from_suggestion");
    expect(canHandoff(c).blockers).toEqual(["person_not_confirmed"]);
  });

  it("支援者の追記は、本人が確認するまで引き継げない", () => {
    let c = setShareScope(createCard("c1", STATEMENT, "text"), ["what"]);
    c = setField(c, "where", "職場", "worker_added");
    c = confirmCard(c);
    expect(canHandoff(c).blockers).toEqual(["worker_added_unconfirmed"]);
    c = confirmField(c, "where");
    c = confirmCard(c);
    expect(canHandoff(c).ok).toBe(true);
  });

  it("本人の言葉・選んだ候補は、確認済みとして入る", () => {
    let c = createCard("c1", STATEMENT, "text");
    c = setField(c, "what", "仕事・学校のこと", "chosen_from_suggestion");
    expect(c.fields.what).toEqual({
      value: "仕事・学校のこと",
      source: "chosen_from_suggestion",
      confirmed: true,
    });
  });

  it("空の項目は入れられない", () => {
    expect(() => setField(createCard("c1", STATEMENT, "text"), "what", "  ", "own_words")).toThrow();
  });
});

describe("suggestions", () => {
  const c = createCard("c1", STATEMENT, "text");

  it("本人の発言に実在する引用に基づく候補は通る", () => {
    const r = validateSuggestion(STATEMENT, {
      field: "what",
      text: "仕事で困っていることを、うまく伝えられない",
      basis: { kind: "quote", quote: "うまく伝えられなくて" },
    });
    expect(r).toEqual({ ok: true });
  });

  it("引用が発言の中にない候補は、推測として拒否する", () => {
    const r = validateSuggestion(STATEMENT, {
      field: "what",
      text: "職場でいじめられている",
      basis: { kind: "quote", quote: "いじめられている" },
    });
    expect(r).toEqual({ ok: false, reason: "quote_not_in_statement" });
  });

  it("固定の選択肢だけが、引用なしで通る", () => {
    expect(
      validateSuggestion(STATEMENT, { field: "help", text: "話を聞いてほしい", basis: { kind: "common_option" } }),
    ).toEqual({ ok: true });
    expect(
      validateSuggestion(STATEMENT, { field: "help", text: "病院に行くべき", basis: { kind: "common_option" } }),
    ).toEqual({ ok: false, reason: "not_a_common_option" });
  });

  it("ガードレールに触れる候補は拒否する（診断など）", () => {
    const r = validateSuggestion("私は困っています。診断してください。", {
      field: "what",
      text: "発達障害ですか",
      basis: { kind: "quote", quote: "困っています" },
    });
    expect(r).toEqual({ ok: false, reason: "guardrail" });
  });

  it("全角・半角、空白の違いは吸収する", () => {
    const r = validateSuggestion("お金が　足りません ", {
      field: "what",
      text: "お金のこと",
      basis: { kind: "quote", quote: "お金が足りません" },
    });
    expect(r).toEqual({ ok: true });
  });

  it("抜けている項目だけ質問し、選択肢も付ける。全部に答えなくてよい", () => {
    const filled = setField(c, "what", "仕事・学校のこと", "chosen_from_suggestion");
    const qs = followUpQuestions(filled);
    expect(qs.map((q) => q.field)).toEqual(["when", "where", "help"]);
    expect(qs.every((q) => q.options.length > 0)).toBe(true);
    expect(qs.find((q) => q.field === "when")?.question).toContain("分からなければ");
  });

  it("「これでいいですか？」は、候補であることと、選ぶのは本人であることを示す", () => {
    const p = confirmPrompt({ field: "help", text: "話を聞いてほしい", basis: { kind: "common_option" } });
    expect(p).toContain("候補");
    expect(p).toContain("話を聞いてほしい");
  });

  it("選択肢にガードレールに触れる文言が混ざっていない", () => {
    for (const options of Object.values(COMMON_OPTIONS)) {
      for (const text of options) {
        expect(screenRequest(text).verdict).toBe("allow");
      }
    }
  });
});

import { clearField, joinItems } from "./card";

describe("複数選択", () => {
  it("選んだものと自分の言葉を、1つの値にまとめる", () => {
    expect(joinItems(["お金のこと", " 家族のこと ", ""])).toBe("お金のこと、家族のこと");
  });
  it("項目を空に戻すと、確認し直しになる", () => {
    let c = createCard("c", "x", "text");
    c = setField(c, "what", "お金のこと", "chosen_from_suggestion");
    c = confirmCard(c);
    c = clearField(c, "what");
    expect(c.fields.what).toBeUndefined();
    expect(c.personConfirmed).toBe(false);
  });
});
