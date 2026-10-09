import { describe, expect, it } from "vitest";
import { parseProfile, validateProfile } from "./profile";

describe("基本情報（この端末だけ）", () => {
  it("名前・住所・電話などを受け取り、長すぎる文字は切る", () => {
    const r = validateProfile({ name: "山田 花子", phone: "090-1234-5678", address: "あ".repeat(300) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("山田 花子");
      expect(r.value.address?.length).toBe(120);
    }
  });
  it("マイナンバーのような12桁の数字は、受け付けない（ハイフンや空白があっても）", () => {
    expect(validateProfile({ name: "123456789012" })).toEqual({ ok: false, reason: "id_number" });
    expect(validateProfile({ address: "1234 5678 9012" })).toEqual({ ok: false, reason: "id_number" });
    expect(validateProfile({ address: "1234-5678-9012" })).toEqual({ ok: false, reason: "id_number" });
  });
  it("電話番号や郵便番号の長さの数字は、通す", () => {
    expect(validateProfile({ phone: "090-1234-5678", address: "〒150-0001 東京都渋谷区神宮前1-2-3" }).ok).toBe(true);
  });
  it("知らない項目は、捨てる。壊れた保存データは、無いものとして扱う", () => {
    const r = validateProfile({ name: "A", passport: "X123" });
    expect(r.ok && Object.keys(r.value)).toEqual(["name"]);
    expect(parseProfile("{not json")).toBeNull();
    expect(parseProfile(JSON.stringify({}))).toBeNull();
    expect(parseProfile(null)).toBeNull();
  });
});

describe("追加した項目（メール・連絡のしかた）", () => {
  it("メールと、ひとことも、受け取る。長さは切る", () => {
    const r = validateProfile({ email: "a@example.com", memo: "あ".repeat(100) });
    expect(r.ok && r.value.email).toBe("a@example.com");
    expect(r.ok && r.value.memo?.length).toBe(60);
  });
});

import { profileFromFragment, profileToFragment } from "./profile";

describe("QR で渡す基本情報（#以降）", () => {
  it("日本語も、往復できる", () => {
    const p = { name: "山田 花子", address: "東京都渋谷区神宮前1-2-3", phone: "090-1234-5678" };
    const f = profileToFragment(p);
    expect(f?.startsWith("#p=")).toBe(true);
    expect(profileFromFragment(f ?? "")).toEqual(p);
  });
  it("マイナンバーのような数字は、つくれない。壊れた文字・長すぎる文字は、読まない", () => {
    expect(profileToFragment({ name: "123456789012" })).toBeNull();
    expect(profileFromFragment("#p=!!!")).toBeNull();
    expect(profileFromFragment("#p=" + "A".repeat(2000))).toBeNull();
    expect(profileFromFragment("#other=1")).toBeNull();
    expect(profileToFragment({})).toBeNull();
  });
});
