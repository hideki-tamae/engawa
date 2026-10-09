import { beforeAll, describe, expect, it } from "vitest";

let tokens: typeof import("./tokens");
let owner: typeof import("./owner");
let storeMod: typeof import("./store");

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-secret-0123456789abcdef";
  tokens = await import("./tokens");
  owner = await import("./owner");
  storeMod = await import("./store");
});

const base = (token: string, v?: 2) => ({
  token,
  card: { id: "c", statement: "x", inputMode: "text" as const, fields: {}, shareScope: [], personConfirmed: false },
  log: [],
  withdrawn: false,
  ...(v ? { v } : {}),
});

describe("本人用と窓口用の合鍵", () => {
  it("窓口用は、本人用から作られ、決まった形で、本人用とは別の値になる", () => {
    const o = tokens.newOwnerToken();
    const w = tokens.windowIdFor(o);
    expect(w).toMatch(/^[a-f0-9]{32}$/);
    expect(w).not.toBe(o);
    expect(tokens.windowIdFor(o)).toBe(w);
    expect(tokens.windowIdFor(tokens.newOwnerToken())).not.toBe(w);
  });
  it("本人用の合鍵で、手帳が見つかる。窓口用の合鍵を、本人用として出しても、見つからない", async () => {
    const o = tokens.newOwnerToken();
    const w = tokens.windowIdFor(o);
    await storeMod.store.put(base(w, 2));
    expect((await owner.ownerHandoff(o))?.token).toBe(w);
    expect(await owner.ownerHandoff(w)).toBeUndefined();
  });
  it("以前の手帳（合鍵が1つ）は、そのまま、本人用として使える", async () => {
    const legacy = tokens.newOwnerToken();
    await storeMod.store.put(base(legacy));
    expect((await owner.ownerHandoff(legacy))?.token).toBe(legacy);
  });
  it("形の違う文字は、探さない", async () => {
    expect(await owner.ownerHandoff("../etc/passwd")).toBeUndefined();
    expect(await owner.ownerHandoff("")).toBeUndefined();
  });
});
