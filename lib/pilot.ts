import { screenInput } from "./guardrails";

/**
 * パイロット（無料の試行）の申し込み。窓口・支援機関の方が、連絡先を残す。
 * 本人（相談する側）の情報は、ここには入れない。連絡先は180日で自動削除。
 */
export const ORG_KINDS = ["gov", "shakyo", "medical", "school", "npo", "other"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export interface PilotDoc {
  org: string;
  kind: OrgKind;
  contactName?: string;
  email: string;
  note?: string;
  at: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validatePilot(input: unknown): { ok: true; value: Omit<PilotDoc, "at"> } | { ok: false; reason: string } {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "invalid" };
  const o = input as Record<string, unknown>;
  if (o.consent !== true) return { ok: false, reason: "consent" };
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim() : "").slice(0, max);
  const org = str(o.org, 60);
  const email = str(o.email, 120);
  if (!org) return { ok: false, reason: "org" };
  if (!EMAIL.test(email)) return { ok: false, reason: "email" };
  if (typeof o.kind !== "string" || !(ORG_KINDS as readonly string[]).includes(o.kind)) return { ok: false, reason: "kind" };
  const value: Omit<PilotDoc, "at"> = { org, kind: o.kind as OrgKind, email };
  const contactName = str(o.contactName, 40);
  if (contactName) value.contactName = contactName;
  const note = str(o.note, 300);
  if (note) {
    // 一言に、相談者の個人情報（電話・住所など）を書かない
    if (screenInput(note).verdict === "refuse") return { ok: false, reason: "note_pii" };
    value.note = note;
  }
  return { ok: true, value };
}
