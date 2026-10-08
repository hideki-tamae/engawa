import { describe, expect, it } from "vitest";
import { verifyChain } from "./audit-chain";
import { confirmCard, createCard, setField, setShareScope } from "./card";
import { recordReadBack, share } from "./handoff";
import { RETENTION_DAYS, deserialize, serialize } from "./store";

describe("保存の往復", () => {
  it("保存して読み戻しても、カードも記録も同じで、ハッシュの連鎖が保たれる", () => {
    let c = createCard("c1", "家賃のことで困っています", "text");
    c = setField(c, "what", "お金のこと", "chosen_from_suggestion");
    c = confirmCard(setShareScope(c, ["what"]));
    const s = share(c, "tok");
    if (!s.ok) throw new Error("share failed");
    const rb = recordReadBack(s.value, "confirmed");
    if (!rb.ok) throw new Error("rb failed");
    const doc = serialize(rb.value);
    const back = deserialize("tok", doc);
    expect(back).toEqual(rb.value);
    expect(verifyChain(back.log).ok).toBe(true);
  });

  it("保存期限が、決めた日数になる", () => {
    const now = new Date("2026-10-08T00:00:00Z");
    let c = createCard("c2", "x", "text");
    c = setShareScope(setField(c, "what", "お金のこと", "chosen_from_suggestion"), ["what"]);
    const s = share(confirmCard(c), "t");
    if (!s.ok) throw new Error("share failed");
    const doc = serialize(s.value, now);
    expect((doc.expireAt.getTime() - now.getTime()) / 86_400_000).toBe(RETENTION_DAYS);
  });
});
