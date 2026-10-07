import { createHash } from "node:crypto";

/**
 * 追記専用・ハッシュ連鎖の監査ログ。
 * - 改ざんを「検知」できる（防止するものではない）。
 * - 訂正・撤回は上書きせず、新しいエントリとして追記する。
 * - エントリには本文（困りごとの内容）や個人情報を入れない。種別・ID・理由コード・項目名のみ。
 */

export const GENESIS_HASH = "0".repeat(64);

export type EventType =
  | "card_created"
  | "card_edited"
  | "shared"
  | "read_back"
  | "confirmed"
  | "corrected"
  | "withdrawn"
  | "handoff"
  | "refused";

export type Actor = "person" | "worker" | "agent" | "system";
export type DetailValue = string | number | boolean;

export interface AuditEntry {
  seq: number;
  type: EventType;
  cardId: string;
  actor: Actor;
  at: string;
  detail: Record<string, DetailValue>;
  prevHash: string;
  hash: string;
}

export interface AppendInput {
  type: EventType;
  cardId: string;
  actor: Actor;
  at?: string;
  detail?: Record<string, DetailValue>;
}

const FORBIDDEN_DETAIL_KEYS = [
  "text",
  "content",
  "body",
  "name",
  "address",
  "phone",
  "email",
  "message",
  "note",
];
const MAX_DETAIL_VALUE_LENGTH = 64;

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
}

function hashBase(base: Omit<AuditEntry, "hash">): string {
  return createHash("sha256").update(canonicalize(base)).digest("hex");
}

function assertSafeDetail(detail: Record<string, DetailValue>): void {
  for (const [key, value] of Object.entries(detail)) {
    if (FORBIDDEN_DETAIL_KEYS.includes(key.toLowerCase())) {
      throw new Error(`audit detail key not allowed: ${key}`);
    }
    if (typeof value === "string" && value.length > MAX_DETAIL_VALUE_LENGTH) {
      throw new Error(`audit detail value too long: ${key}`);
    }
  }
}

export function appendEntry(
  log: readonly AuditEntry[],
  input: AppendInput,
): AuditEntry[] {
  const detail = input.detail ?? {};
  assertSafeDetail(detail);
  const prev = log[log.length - 1];
  const base: Omit<AuditEntry, "hash"> = {
    seq: log.length,
    type: input.type,
    cardId: input.cardId,
    actor: input.actor,
    at: input.at ?? new Date().toISOString(),
    detail,
    prevHash: prev ? prev.hash : GENESIS_HASH,
  };
  return [...log, { ...base, hash: hashBase(base) }];
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; brokenAt: number; reason: string };

export function verifyChain(log: readonly AuditEntry[]): VerifyResult {
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    if (entry.seq !== i) {
      return { ok: false, brokenAt: i, reason: "seq_mismatch" };
    }
    if (entry.prevHash !== prevHash) {
      return { ok: false, brokenAt: i, reason: "prev_hash_mismatch" };
    }
    const { hash, ...base } = entry;
    if (hashBase(base) !== hash) {
      return { ok: false, brokenAt: i, reason: "hash_mismatch" };
    }
    prevHash = hash;
  }
  return { ok: true };
}
