/**
 * 困りごとカード。
 * - 1文でも成立する（最小成立）。全項目が埋まっていなくても、本人が選べば次の窓口に引き継げる。
 * - 各項目に「出どころ」を残す。本人の言葉／候補から本人が選んだ／支援者が追記（本人の確認が必要）。
 * - 推測は足さない。足せるのは、本人の発言の引用に基づく候補か、固定の選択肢から本人が選んだものだけ。
 */

export const FIELD_KEYS = ["when", "where", "what", "help"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export type Source = "own_words" | "chosen_from_suggestion" | "worker_added";
export type InputMode = "text" | "voice" | "text_and_voice";

export interface FieldValue {
  value: string;
  source: Source;
  /** 本人が確認済みか。支援者が追記した項目は、本人が確認するまで false。 */
  confirmed: boolean;
}

export interface ProblemCard {
  id: string;
  /** 本人の言葉（音声の文字起こしを含む。本人が編集できる）。音声ファイルは保存しない。 */
  statement: string;
  inputMode: InputMode;
  fields: Partial<Record<FieldKey, FieldValue>>;
  /** 本人が選んだ共有範囲 */
  shareScope: FieldKey[];
  /** 本人が、カード全体を「これで渡してよい」と確認したか */
  personConfirmed: boolean;
}

export function createCard(
  id: string,
  statement: string,
  inputMode: InputMode,
): ProblemCard {
  return {
    id,
    statement,
    inputMode,
    fields: {},
    shareScope: [],
    personConfirmed: false,
  };
}

export function setField(
  card: ProblemCard,
  key: FieldKey,
  value: string,
  source: Source,
): ProblemCard {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("empty field value");
  return {
    ...card,
    personConfirmed: false, // 内容が変わったら、確認し直す
    fields: {
      ...card.fields,
      [key]: { value: trimmed, source, confirmed: source !== "worker_added" },
    },
  };
}

/** 複数選択の項目を、1つの値にまとめる（区切りは「、」）。 */
export function joinItems(items: string[]): string {
  return items.map((i) => i.trim()).filter(Boolean).join("、");
}

/** 項目を空に戻す。内容が変わるので、確認し直す。 */
export function clearField(card: ProblemCard, key: FieldKey): ProblemCard {
  const { [key]: _removed, ...rest } = card.fields;
  void _removed;
  return { ...card, personConfirmed: false, fields: rest };
}

/** 本人が、支援者の追記を確認する。 */
export function confirmField(card: ProblemCard, key: FieldKey): ProblemCard {
  const field = card.fields[key];
  if (!field) throw new Error(`no such field: ${key}`);
  return {
    ...card,
    fields: { ...card.fields, [key]: { ...field, confirmed: true } },
  };
}

export function setShareScope(card: ProblemCard, scope: FieldKey[]): ProblemCard {
  return { ...card, shareScope: [...new Set(scope)], personConfirmed: false };
}

export function confirmCard(card: ProblemCard): ProblemCard {
  return { ...card, personConfirmed: true };
}

export function missingFields(card: ProblemCard): FieldKey[] {
  return FIELD_KEYS.filter((k) => !card.fields[k]);
}

/** 1文でも、書かれていれば成立する。 */
export function isMinimumViable(card: ProblemCard): boolean {
  return card.statement.trim().length > 0;
}

export type HandoffBlocker =
  | "statement_empty"
  | "no_share_scope"
  | "person_not_confirmed"
  | "worker_added_unconfirmed";

/**
 * 引き継ぎの条件。全項目が埋まっていることは、条件にしない。
 * 条件は、書かれていること、本人が範囲を選んだこと、本人が確認したこと、
 * 支援者の追記を本人が確認したこと、のみ。
 */
export function canHandoff(card: ProblemCard): {
  ok: boolean;
  blockers: HandoffBlocker[];
} {
  const blockers: HandoffBlocker[] = [];
  if (!isMinimumViable(card)) blockers.push("statement_empty");
  if (card.shareScope.length === 0) blockers.push("no_share_scope");
  if (!card.personConfirmed) blockers.push("person_not_confirmed");
  const unconfirmed = FIELD_KEYS.some((k) => {
    const f = card.fields[k];
    return f !== undefined && f.source === "worker_added" && !f.confirmed;
  });
  if (unconfirmed) blockers.push("worker_added_unconfirmed");
  return { ok: blockers.length === 0, blockers };
}
