import { describe, expect, it } from "vitest";
import { runScenario } from "./demo";

describe("runScenario（仕組みを見る）", () => {
  it("鍵なし（固定の質問）でも、全ての確認が成立する", async () => {
    const steps = await runScenario(null);
    const failed = steps.flatMap((s) => s.checks.filter((c) => !c.ok).map((c) => `${s.title}: ${c.label}`));
    expect(failed).toEqual([]);
    expect(steps).toHaveLength(7);
  });
});
