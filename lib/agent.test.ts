import { describe, expect, it } from "vitest";
import { proposeNext } from "./agent";
import { createCard } from "./card";

const card = createCard("c", "家賃が払えなくて、役所で何度も同じ話をさせられた", "text");
const gen = (obj: unknown) => async () => JSON.stringify(obj);

describe("proposeNext", () => {
  it("鍵がなければ固定の質問に戻る", async () => {
    const p = await proposeNext(card, null);
    expect(p?.source).toBe("fallback");
  });

  it("発言に実在する引用の候補だけを採用する", async () => {
    const p = await proposeNext(
      card,
      gen({
        field: "what",
        question: "どんなことで困っていますか？",
        suggestions: [
          { text: "家賃が払えない", quote: "家賃が払えなくて" },
          { text: "うつ病かもしれない", quote: "うつ病" },
        ],
      }),
    );
    expect(p?.source).toBe("gemini");
    expect(p?.suggestions).toHaveLength(1);
    expect(p?.suggestions[0].text).toBe("家賃が払えなくて");
    expect(p?.dropped).toBe(1);
  });

  it("いつ/どこの質問には、引用の候補を付けない", async () => {
    const p = await proposeNext(
      card,
      gen({
        field: "when",
        question: "いつ頃のことですか？",
        suggestions: [{ text: "x", quote: "家賃が払えなくて" }],
      }),
    );
    expect(p?.source).toBe("gemini");
    expect(p?.suggestions).toHaveLength(0);
  });

  it("診断や責める調子の質問は通さず、固定の質問に戻る", async () => {
    const p = await proposeNext(
      card,
      gen({ field: "what", question: "あなたはうつ病ですか？診断してください", suggestions: [] }),
    );
    expect(p?.source).toBe("fallback");
  });

  it("壊れた出力や、抜けていない項目の指定は、固定の質問に戻る", async () => {
    expect((await proposeNext(card, async () => "not json"))?.source).toBe("fallback");
    expect((await proposeNext(card, gen({ field: "zzz", question: "?" })))?.source).toBe("fallback");
  });
});
