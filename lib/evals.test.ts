import { describe, expect, it } from "vitest";
import { runDeterministicEvals } from "./evals";

describe("Evals（決まった入力）", () => {
  it("全件が通る。通らない件があれば、どれかを示す", async () => {
    const r = await runDeterministicEvals();
    const failed = r.cases.filter((c) => !c.ok).map((c) => `${c.id}: ${c.desc}（${c.detail ?? ""}）`);
    expect(failed).toEqual([]);
    expect(r.total).toBeGreaterThanOrEqual(35);
  });
});
