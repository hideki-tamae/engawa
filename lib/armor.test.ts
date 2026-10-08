import { describe, expect, it } from "vitest";
import { proposeNext } from "./agent";
import { makeGuard } from "./armor";
import type { ProblemCard } from "./card";

const T = "projects/p/locations/asia-northeast1/templates/t";
const tok = async () => "x";
const reply = (state: string) => (async () => new Response(JSON.stringify({ sanitizationResult: { filterMatchState: state } }))) as unknown as typeof fetch;
const card = { statement: "家賃が払えなくて、窓口で何度も同じ説明をしている。", fields: {} } as unknown as ProblemCard;
const okModel = async () => JSON.stringify({ field: "what", question: "どんなことで困っていますか", suggestions: [] });

describe("Model Armor（AIの入口と出口の検問所）", () => {
  it("攻撃文が見つかれば flagged、なければ ok", async () => {
    expect(await makeGuard(T, reply("MATCH_FOUND"), tok).prompt("x")).toBe("flagged");
    expect(await makeGuard(T, reply("NO_MATCH_FOUND"), tok).prompt("x")).toBe("ok");
  });
  it("通信失敗・エラー・空文字は unavailable（止めずに、自前のガードレールだけで動く）", async () => {
    const boom = (async () => {
      throw new Error("down");
    }) as unknown as typeof fetch;
    const err = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
    expect(await makeGuard(T, boom, tok).prompt("x")).toBe("unavailable");
    expect(await makeGuard(T, err, tok).prompt("x")).toBe("unavailable");
    expect(await makeGuard(T, reply("NO_MATCH_FOUND"), tok).prompt("  ")).toBe("unavailable");
  });
  it("入力が flagged なら、AIに渡さず、固定の質問に戻す", async () => {
    let called = 0;
    const gen = async () => {
      called++;
      return okModel();
    };
    const p = await proposeNext(card, gen, makeGuard(T, reply("MATCH_FOUND"), tok));
    expect(called).toBe(0);
    expect(p?.source).toBe("fallback");
    expect(p?.armor).toBe("flagged");
  });
  it("AIの出力が flagged なら、使わない", async () => {
    let n = 0;
    const flipping = (async () => new Response(JSON.stringify({ sanitizationResult: { filterMatchState: ++n === 1 ? "NO_MATCH_FOUND" : "MATCH_FOUND" } }))) as unknown as typeof fetch;
    const p = await proposeNext(card, okModel, makeGuard(T, flipping, tok));
    expect(p?.source).toBe("fallback");
  });
  it("検問所が使えなくても、通常どおり動く", async () => {
    const err = (async () => new Response("no", { status: 503 })) as unknown as typeof fetch;
    const p = await proposeNext(card, okModel, makeGuard(T, err, tok));
    expect(p?.source).toBe("gemini");
    expect(p?.armor).toBe("unavailable");
  });
});
