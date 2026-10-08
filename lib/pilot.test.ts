import { describe, expect, it } from "vitest";
import { validatePilot } from "./pilot";

const good = { org: "〇〇区 子ども家庭支援センター", kind: "gov", email: "staff@example.lg.jp", consent: true };

describe("パイロットの申し込み", () => {
  it("組織・種別・メール・同意がそろえば、受け付ける", () => {
    expect(validatePilot(good).ok).toBe(true);
  });
  it("同意がなければ、受け付けない", () => {
    expect(validatePilot({ ...good, consent: false })).toEqual({ ok: false, reason: "consent" });
  });
  it("メールの形、種別、組織名を確かめる", () => {
    expect(validatePilot({ ...good, email: "not-an-email" })).toEqual({ ok: false, reason: "email" });
    expect(validatePilot({ ...good, kind: "evil" })).toEqual({ ok: false, reason: "kind" });
    expect(validatePilot({ ...good, org: "  " })).toEqual({ ok: false, reason: "org" });
  });
  it("一言に電話番号などがあれば、受け付けない（相談者の情報を入れさせない）", () => {
    expect(validatePilot({ ...good, note: "相談者の電話は 090-1234-5678" })).toEqual({ ok: false, reason: "note_pii" });
    expect(validatePilot({ ...good, note: "まずは1拠点で試したいです" }).ok).toBe(true);
  });
  it("長すぎる文字は、切る", () => {
    const r = validatePilot({ ...good, org: "あ".repeat(200) });
    expect(r.ok && r.value.org.length).toBe(60);
  });
});
