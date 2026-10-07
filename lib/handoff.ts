import { createHash } from "node:crypto";
import { type AuditEntry, appendEntry, canonicalize } from "./audit-chain";
import { type FieldKey, FIELD_KEYS, type ProblemCard, canHandoff } from "./card";

/**
 * 引き継ぎ。本人が選んだ範囲だけが、窓口に見える。
 * 窓口に渡る形（SharedView）には、共有範囲に入っていない項目は含まれない。
 * 経過は、改ざん検知つきの記録（audit-chain）に残す。記録には本文を入れない。
 */

export interface SharedView {
  cardId: string;
  statement: string;
  fields: Partial<Record<FieldKey, { value: string; source: string }>>;
}

export interface Handoff {
  token: string;
  card: ProblemCard;
  log: AuditEntry[];
  withdrawn: boolean;
}

export type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

export function viewFor(card: ProblemCard): SharedView {
  const fields: SharedView["fields"] = {};
  for (const k of FIELD_KEYS) {
    const f = card.fields[k];
    if (f && card.shareScope.includes(k)) {
      fields[k] = { value: f.value, source: f.source };
    }
  }
  return { cardId: card.id, statement: card.statement, fields };
}

/** 本人がカードを共有する。条件を満たさなければ、共有できない。 */
export function share(card: ProblemCard, token: string): Result<Handoff> {
  const check = canHandoff(card);
  if (!check.ok) return { ok: false, reason: check.blockers.join(",") };
  let log: AuditEntry[] = [];
  log = appendEntry(log, { type: "card_created", cardId: card.id, actor: "person" });
  log = appendEntry(log, {
    type: "shared",
    cardId: card.id,
    actor: "person",
    detail: { fields: card.shareScope.length },
  });
  return { ok: true, value: { token, card, log, withdrawn: false } };
}

/** 窓口が読む。取り下げられていれば、何も見せない。 */
export function open(h: Handoff, windowLabel: string): Result<{ view: SharedView; handoff: Handoff }> {
  if (h.withdrawn) return { ok: false, reason: "withdrawn" };
  const label = windowLabel.slice(0, 40);
  const last = h.log[h.log.length - 1];
  // 同じ窓口が、直前の記録のまま開き直しても、記録は増やさない（再読み込みで水増ししない）
  const repeat =
    last?.type === "read_back" && last.actor === "worker" && last.detail.window === label;
  const log = repeat
    ? h.log
    : appendEntry(h.log, {
        type: "read_back",
        cardId: h.card.id,
        actor: "worker",
        detail: { window: label, step: "opened" },
      });
  return { ok: true, value: { view: viewFor(h.card), handoff: { ...h, log } } };
}

/** 窓口が本人に読み返した。本人が合っている／違うと答えたことを記録する。 */
export function recordReadBack(h: Handoff, outcome: "confirmed" | "corrected"): Result<Handoff> {
  if (h.withdrawn) return { ok: false, reason: "withdrawn" };
  const log = appendEntry(h.log, {
    type: outcome,
    cardId: h.card.id,
    actor: "person",
    detail: { by: "read_back" },
  });
  return { ok: true, value: { ...h, log } };
}

/** 次の窓口への引き継ぎ。本人が確認済みであることが条件。 */
export function handOff(h: Handoff, toWindow: string): Result<Handoff> {
  if (h.withdrawn) return { ok: false, reason: "withdrawn" };
  const confirmed = h.log.some((e) => e.type === "confirmed");
  if (!confirmed) return { ok: false, reason: "person_not_confirmed_on_read_back" };
  const log = appendEntry(h.log, {
    type: "handoff",
    cardId: h.card.id,
    actor: "worker",
    detail: { to: toWindow.slice(0, 40) },
  });
  return { ok: true, value: { ...h, log } };
}

/** 本人がいつでも取り下げられる。 */
export function withdraw(h: Handoff): Handoff {
  const log = appendEntry(h.log, { type: "withdrawn", cardId: h.card.id, actor: "person" });
  return { ...h, log, withdrawn: true };
}

/**
 * 照合コード。紙に印刷した内容が、原本（記録）と一致するかを、後から確かめるためのもの。
 * 「本人が選んだ範囲の内容」と「作成日時」から作る。内容が1字でも違えば、コードは変わる。
 * ※ コードは、紙が原本と同じ内容であることを示すだけで、法的な証拠力を保証するものではない。
 */
export function proofFor(h: Handoff): { createdAt: string; code: string } {
  const createdAt = h.log[0]?.at ?? "";
  const digest = createHash("sha256")
    .update(canonicalize({ view: viewFor(h.card), createdAt }))
    .digest("hex");
  return { createdAt, code: digest.slice(0, 12) };
}

export type VerifyOutcome =
  | { match: true; createdAt: string }
  | { match: false; reason: "withdrawn" | "mismatch" };

export function verifyPaper(h: Handoff, code: string): VerifyOutcome {
  if (h.withdrawn) return { match: false, reason: "withdrawn" };
  const p = proofFor(h);
  return p.code === code.trim().toLowerCase()
    ? { match: true, createdAt: p.createdAt }
    : { match: false, reason: "mismatch" };
}
