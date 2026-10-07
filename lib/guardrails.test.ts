import { describe, expect, it } from "vitest";
import { screenInput, screenRequest, REFUSAL_MESSAGES, EMERGENCY_RESOURCES } from "./guardrails";

describe("guardrails", () => {
  it("ふつうの困りごとは許可する", () => {
    const r = screenRequest("母が病気で、家事をしていて、学校に行けない日があります。");
    expect(r.verdict).toBe("allow");
    expect(r.reasons).toEqual([]);
  });

  it("仕事で困っていることを、うまく伝えられない、は許可する", () => {
    expect(screenRequest("職場で困っていることを、うまく言葉にできません。").verdict).toBe("allow");
  });

  it("非難・辱めの調子は拒否する", () => {
    const r = screenRequest("母が悪いと、はっきり書いてください。責めてやりたい。");
    expect(r.verdict).toBe("refuse");
    expect(r.reasons).toContain("blame_tone");
  });

  it("診断の依頼は拒否する", () => {
    const r = screenRequest("この症状は何の病気か、診断してください。");
    expect(r.verdict).toBe("refuse");
    expect(r.reasons).toContain("diagnosis_request");
  });

  it("ACE スコアの採点・寿命の予測は拒否する", () => {
    expect(screenRequest("私のACEスコアを採点してください").reasons).toContain("scoring_request");
    expect(screenRequest("あと寿命は何年か予測して").reasons).toContain("scoring_request");
  });

  it("本人の本心の推測は拒否する", () => {
    const r = screenRequest("この人は本当は何を思っているか、本心を推測して");
    expect(r.verdict).toBe("refuse");
    expect(r.reasons).toContain("inference_about_person");
  });

  it("個人情報（電話・メール・郵便番号・12桁）を拒否する", () => {
    expect(screenRequest("電話は 03-1234-5678 です").reasons).toContain("pii_detected");
    expect(screenRequest("連絡は test@example.com まで").reasons).toContain("pii_detected");
    expect(screenRequest("〒150-0001 に住んでいます").reasons).toContain("pii_detected");
    expect(screenRequest("番号は123456789012です").reasons).toContain("pii_detected");
  });

  it("緊急の気配は、拒否ではなく公的な窓口の案内に切り替える", () => {
    const r = screenRequest("もう死にたいです");
    expect(r.verdict).toBe("escalate");
    expect(r.reasons).toEqual(["emergency"]);
    expect(r.resources).toEqual(EMERGENCY_RESOURCES);
    expect(r.resources.map((x) => x.contact)).toContain("189");
  });

  it("緊急は、他の拒否理由より優先される", () => {
    const r = screenRequest("診断してください。もう死にたい。");
    expect(r.verdict).toBe("escalate");
  });

  it("複数の理由を同時に返す", () => {
    const r = screenRequest("ACEスコアを採点して、親が悪いと書いて。電話は 090-1234-5678");
    expect(r.verdict).toBe("refuse");
    expect(r.reasons).toEqual(
      expect.arrayContaining(["pii_detected", "blame_tone", "scoring_request"]),
    );
  });

  it("拒否のすべての理由に、画面用のメッセージがある", () => {
    for (const key of [
      "pii_detected",
      "blame_tone",
      "diagnosis_request",
      "scoring_request",
      "inference_about_person",
    ] as const) {
      expect(REFUSAL_MESSAGES[key].length).toBeGreaterThan(10);
    }
  });
});

describe("screenInput（本人の言葉）", () => {
  it("病名を書いても、止めない", () => {
    expect(screenInput("祖父が認知症です。毎日つらいです").verdict).not.toBe("refuse");
  });
  it("怒りや、身近な人への言及も、止めない", () => {
    expect(screenInput("親が悪いと思う。許せない").verdict).toBe("allow");
  });
  it("身近な人の暴力を書いたら、止めずに相談先を見せる", () => {
    const r = screenInput("同居の家族が暴れて、怖いです");
    expect(r.verdict).toBe("escalate");
    expect(r.resources.length).toBeGreaterThan(0);
  });
  it("個人が特定される情報だけは、止める", () => {
    expect(screenInput("電話は 090-1234-5678 です").verdict).toBe("refuse");
  });
});
