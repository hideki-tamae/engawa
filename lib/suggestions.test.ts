
import { ENABLE_MORE_WHAT, WHAT_MORE } from "./suggestions";
import { screenRequest } from "./guardrails";
import { describe as d2, expect as e2, it as i2 } from "vitest";

d2("追加の選択肢（戻せる設定）", () => {
  i2("有効のときは4つ。どれも、診断・評価の言い回しではない", () => {
    e2(ENABLE_MORE_WHAT).toBe(true);
    e2(WHAT_MORE.length).toBe(4);
    for (const o of WHAT_MORE) e2(screenRequest(o).verdict).toBe("allow");
  });
});
