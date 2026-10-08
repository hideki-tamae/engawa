import { afterEach, describe, expect, it, vi } from "vitest";
import { logEvent } from "./log";

describe("logEvent", () => {
  afterEach(() => vi.restoreAllMocks());
  it("出来事・件数・理由コードだけを出し、禁止キーは落とす", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logEvent("guardrail_block", { reasons: ["pii_detected"], count: 1, statement: "家賃が払えない", token: "abc", phone: "090" }, "WARNING");
    const out = JSON.parse(spy.mock.calls[0][0] as string);
    expect(out.event).toBe("guardrail_block");
    expect(out.severity).toBe("WARNING");
    expect(out.reasons).toEqual(["pii_detected"]);
    expect(out).not.toHaveProperty("statement");
    expect(out).not.toHaveProperty("token");
    expect(out).not.toHaveProperty("phone");
    expect(JSON.stringify(out)).not.toContain("家賃");
  });
});
