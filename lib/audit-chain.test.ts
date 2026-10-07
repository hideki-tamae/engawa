import { describe, expect, it } from "vitest";
import {
  appendEntry,
  verifyChain,
  GENESIS_HASH,
  type AuditEntry,
} from "./audit-chain";

const T = "2026-10-06T00:00:00.000Z";

function sampleLog(): AuditEntry[] {
  let log: AuditEntry[] = [];
  log = appendEntry(log, { type: "card_created", cardId: "c1", actor: "person", at: T });
  log = appendEntry(log, { type: "shared", cardId: "c1", actor: "person", at: T, detail: { to: "window_1" } });
  log = appendEntry(log, { type: "read_back", cardId: "c1", actor: "worker", at: T });
  log = appendEntry(log, { type: "confirmed", cardId: "c1", actor: "person", at: T });
  return log;
}

describe("audit-chain", () => {
  it("検証に通る。先頭の prevHash は GENESIS", () => {
    const log = sampleLog();
    expect(log[0].prevHash).toBe(GENESIS_HASH);
    expect(verifyChain(log)).toEqual({ ok: true });
  });

  it("空のログは有効", () => {
    expect(verifyChain([])).toEqual({ ok: true });
  });

  it("項目の書き換えを検知する", () => {
    const log = sampleLog();
    const tampered = log.map((e) => ({ ...e }));
    tampered[1] = { ...tampered[1], detail: { to: "window_9" } };
    const result = verifyChain(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.brokenAt).toBe(1);
      expect(result.reason).toBe("hash_mismatch");
    }
  });

  it("エントリの削除を検知する", () => {
    const log = sampleLog();
    const result = verifyChain([log[0], log[2], log[3]]);
    expect(result.ok).toBe(false);
  });

  it("並べ替えを検知する", () => {
    const log = sampleLog();
    const result = verifyChain([log[0], log[2], log[1], log[3]]);
    expect(result.ok).toBe(false);
  });

  it("訂正・撤回は上書きではなく追記される", () => {
    let log = sampleLog();
    const before = JSON.stringify(log);
    log = appendEntry(log, {
      type: "corrected",
      cardId: "c1",
      actor: "person",
      at: T,
      detail: { field: "hope", supersedes: 3 },
    });
    log = appendEntry(log, { type: "withdrawn", cardId: "c1", actor: "person", at: T });
    expect(JSON.stringify(log.slice(0, 4))).toBe(before);
    expect(log).toHaveLength(6);
    expect(verifyChain(log)).toEqual({ ok: true });
  });

  it("本文や個人情報になりうるキーは拒否する", () => {
    expect(() =>
      appendEntry([], { type: "card_created", cardId: "c1", actor: "person", detail: { text: "..." } }),
    ).toThrow();
    expect(() =>
      appendEntry([], { type: "card_created", cardId: "c1", actor: "person", detail: { email: "a@b.c" } }),
    ).toThrow();
  });

  it("長い文字列の値は拒否する", () => {
    expect(() =>
      appendEntry([], {
        type: "card_created",
        cardId: "c1",
        actor: "person",
        detail: { field: "x".repeat(65) },
      }),
    ).toThrow();
  });
});
