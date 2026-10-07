import { describe, expect, it } from "vitest";
import { verifyChain } from "./audit-chain";
import { confirmCard, createCard, setField, setShareScope } from "./card";
import { handOff, open, proofFor, recordReadBack, share, verifyPaper, viewFor, withdraw } from "./handoff";

function readyCard() {
  let c = createCard("c1", "家賃が払えず、窓口で何度も同じ話をした", "text");
  c = setField(c, "what", "お金のこと", "chosen_from_suggestion");
  c = setField(c, "where", "役所・窓口", "chosen_from_suggestion");
  c = setShareScope(c, ["what"]);
  return confirmCard(c);
}

describe("handoff", () => {
  it("共有範囲に入れていない項目は、窓口に見えない", () => {
    const v = viewFor(readyCard());
    expect(v.fields.what?.value).toBe("お金のこと");
    expect(v.fields.where).toBeUndefined();
  });

  it("本人が確認していないカードは共有できない", () => {
    let c = createCard("c2", "困っている", "text");
    c = setShareScope(c, ["what"]);
    const r = share(c, "t");
    expect(r.ok).toBe(false);
  });

  it("読み返しで本人が確認するまで、次の窓口へ引き継げない", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    expect(handOff(s.value, "子ども家庭支援センター").ok).toBe(false);
    const rb = recordReadBack(s.value, "confirmed");
    if (!rb.ok) throw new Error("rb failed");
    const h = handOff(rb.value, "子ども家庭支援センター");
    expect(h.ok).toBe(true);
    if (h.ok) expect(verifyChain(h.value.log).ok).toBe(true);
  });

  it("取り下げ後は、窓口は何も見られない", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    const w = withdraw(s.value);
    expect(open(w, "窓口A").ok).toBe(false);
    expect(verifyChain(w.log).ok).toBe(true);
  });

  it("同じ窓口が続けて開いても、記録は1回", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    const a = open(s.value, "窓口A");
    if (!a.ok) throw new Error("open failed");
    const b = open(a.value.handoff, "窓口A");
    if (!b.ok) throw new Error("open failed");
    expect(b.value.handoff.log.length).toBe(a.value.handoff.log.length);
    const c = open(b.value.handoff, "窓口B");
    if (!c.ok) throw new Error("open failed");
    expect(c.value.handoff.log.length).toBe(a.value.handoff.log.length + 1);
  });

  it("記録には本文が入らない", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    const json = JSON.stringify(s.value.log);
    expect(json).not.toContain("家賃");
  });
});

describe("照合コード（紙と原本の一致）", () => {
  it("同じ内容なら一致し、別のコードは一致しない", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    const { code } = proofFor(s.value);
    expect(verifyPaper(s.value, code).match).toBe(true);
    expect(verifyPaper(s.value, "000000000000").match).toBe(false);
  });
  it("内容が1字でも違うカードのコードでは、一致しない", () => {
    const a = share(readyCard(), "t");
    const other = { ...readyCard(), statement: "家賃が払えず、窓口で何度も同じ話をした。" };
    const b = share(other, "t");
    if (!a.ok || !b.ok) throw new Error("share failed");
    expect(verifyPaper(b.value, proofFor(a.value).code).match).toBe(false);
  });
  it("取り下げ後は、紙のコードも無効", () => {
    const s = share(readyCard(), "t");
    if (!s.ok) throw new Error("share failed");
    const { code } = proofFor(s.value);
    const r = verifyPaper(withdraw(s.value), code);
    expect(r.match).toBe(false);
  });
});
