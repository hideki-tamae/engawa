import { describe, expect, it } from "vitest";
import { validateRating, validateTrial, summarize } from "./trial";

describe("試用の記録の検証", () => {
  it("決められた形だけを受け取る（自由な文字は受け取らない）", () => {
    expect(validateTrial({ sid: "abcdef12-3456", event: "start", t: 0 }).ok).toBe(true);
    expect(validateTrial({ sid: "abcdef12-3456", event: "card_created", t: 90_000, voice: true }).ok).toBe(true);
    expect(validateTrial({ sid: "x", event: "start", t: 0 }).ok).toBe(false);
    expect(validateTrial({ sid: "abcdef12-3456", event: "text", t: 0 }).ok).toBe(false);
    expect(validateTrial({ sid: "abcdef12-3456", event: "start", t: -1 }).ok).toBe(false);
    const r = validateTrial({ sid: "abcdef12-3456", event: "start", t: 5, statement: "家賃が" });
    expect(r.ok && "statement" in r.value).toBe(false);
  });
});

describe("集計", () => {
  const e = (sid: string, event: string, t: number, voice?: boolean) =>
    ({ sid, event, t, voice }) as Parameters<typeof summarize>[0][number];
  it("完了率と、かかった時間の中央値、途中でやめた場所", () => {
    const s = summarize([
      e("aaaaaaaa", "start", 0), e("aaaaaaaa", "card_created", 60_000), e("aaaaaaaa", "share_show", 61_000),
      e("bbbbbbbb", "start", 0), e("bbbbbbbb", "card_created", 120_000, true), e("bbbbbbbb", "share_print", 130_000),
      e("cccccccc", "start", 0), e("cccccccc", "step_ask", 20_000),
    ]);
    expect(s.started).toBe(3);
    expect(s.completed).toBe(2);
    expect(s.completionRate).toBeCloseTo(2 / 3);
    expect(s.medianSeconds).toBe(90);
    expect(s.share.show).toBe(1);
    expect(s.share.print).toBe(1);
    expect(s.lastStepOfDropped).toEqual({ step_ask: 1 });
  });
  it("数がなければ、数字は出さない（null）", () => {
    const s = summarize([]);
    expect(s.completionRate).toBeNull();
    expect(s.medianSeconds).toBeNull();
  });
});

describe("採点の検証", () => {
  const good = { impact: 4, clarity: 5, ease: 4, outcome: 4, polish: 4, fit: 5 };
  it("6項目すべてが1〜5の整数であること", () => {
    expect(validateRating({ scores: good }).ok).toBe(true);
    expect(validateRating({ scores: { ...good, ease: 6 } }).ok).toBe(false);
    expect(validateRating({ scores: { ...good, ease: 3.5 } }).ok).toBe(false);
    const { fit: _fit, ...missing } = good;
    void _fit;
    expect(validateRating({ scores: missing }).ok).toBe(false);
  });
  it("fit は「判断できない」を選べる（点数は入れず、fitUnknown を立てる）", () => {
    const r = validateRating({ scores: { ...good, fit: "unknown" } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.fitUnknown).toBe(true);
      expect(r.value.scores.fit).toBeUndefined();
    }
    expect(validateRating({ scores: { ...good, ease: "unknown" } }).ok).toBe(false);
  });
  it("窓口側の受け入れは、医療・支援・経営の立場の人だけ記録する", () => {
    const ok = validateRating({ scores: good, role: "medical", accept: "conditional" });
    expect(ok.ok && ok.value.accept).toBe("conditional");
    const person = validateRating({ scores: good, role: "person", accept: "yes" });
    expect(person.ok && person.value.accept).toBeUndefined();
    const bad = validateRating({ scores: good, role: "support", accept: "maybe" });
    expect(bad.ok && bad.value.accept).toBeUndefined();
  });
});
