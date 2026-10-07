import { beforeAll, describe, expect, it } from "vitest";
import { checkLogin, issue, verify } from "./session";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-0123456789";
  process.env.WINDOW_ACCOUNTS = "窓口A:pw1,窓口B:pw2";
});

describe("session", () => {
  it("発行したものは検証でき、ユーザー名が戻る", () => {
    expect(verify(issue("窓口A"))).toBe("窓口A");
  });
  it("改ざん・期限切れ・空は通らない", () => {
    const t = issue("窓口A", 0);
    expect(verify(t.replace("A", "B"))).toBeNull();
    expect(verify(t, 9 * 60 * 60 * 1000)).toBeNull();
    expect(verify(undefined)).toBeNull();
    expect(verify("x.y.z")).toBeNull();
  });
  it("ログインは正しい組だけ通る", () => {
    expect(checkLogin("窓口A", "pw1")).toBe(true);
    expect(checkLogin("窓口A", "pw2")).toBe(false);
    expect(checkLogin("窓口C", "pw1")).toBe(false);
  });
});
