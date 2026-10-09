import { FIELD_KEYS, type FieldKey, type ProblemCard, missingFields } from "./card";
import { screenRequest } from "./guardrails";

/**
 * 「これでいいですか？」の仕組み。
 * うまく言葉にできないとき、エージェントは候補を出し、本人が選ぶ。
 * 推測を足さないために、候補には次のどちらかだけを許す。
 *  - 本人の発言からの**引用**に基づく候補（引用は、発言の中に実在しなければならない）
 *  - 固定の選択肢（あらかじめ決めた、一般的な言い方）
 * 候補は、本人が選ぶまで、カードに入らない。
 */

/**
 * 「どんなこと」の、細かい選択肢。厚生労働省の相談申込票の分類（支払い・借金、子育て・介護、ひきこもり・不登校、食べ物がない）を参考にした。
 * 初期表示は、これまでの6つのまま。「ほかにもあてはまるものを見る」を押したときだけ、出す。
 * 戻したいときは、ENABLE_MORE_WHAT を false にする（画面と、相談先の探索の両方が、元に戻る）。
 */
/** 安全に関わる選択肢。「ほかにもあてはまるものを見る」の先頭に置く。選ぶと、すぐに、公的な相談先を出す。 */
export const SAFETY_OPTION = "身の安全が心配（DV・虐待）";

export const ENABLE_MORE_WHAT = true;
/** 安全の選択肢は、設定に関わらず、必ず入る。 */
export const WHAT_MORE: string[] = [
  SAFETY_OPTION,
  ...(ENABLE_MORE_WHAT ? ["支払いや借金のこと", "子育て・介護のこと", "ひきこもり・不登校のこと", "食べるものがない"] : []),
];

export const COMMON_OPTIONS: Record<FieldKey, string[]> = {
  when: ["今日・最近のこと", "ここ数か月", "前からずっと", "いつからか分からない"],
  where: ["家", "学校", "職場", "役所・窓口", "施設", "場所は言いにくい"],
  what: ["お金のこと", "住まいのこと", "仕事・学校のこと", "家族のこと", "体や心の調子", "手続きが分からない"],
  help: [
    "話を聞いてほしい",
    "手続きを一緒にしてほしい",
    "相談先を知りたい",
    "代わりに伝えてほしい",
    "まだ分からない",
  ],
};

export type SuggestionBasis =
  | { kind: "quote"; quote: string }
  | { kind: "common_option" };

export interface Suggestion {
  field: FieldKey;
  text: string;
  basis: SuggestionBasis;
}

const MAX_SUGGESTION_LENGTH = 120;

function normalize(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "");
}

export type SuggestionCheck = { ok: true } | { ok: false; reason: string };

export function validateSuggestion(
  statement: string,
  suggestion: Suggestion,
): SuggestionCheck {
  const text = suggestion.text.trim();
  if (text.length === 0) return { ok: false, reason: "empty" };
  if (text.length > MAX_SUGGESTION_LENGTH) return { ok: false, reason: "too_long" };
  if (!FIELD_KEYS.includes(suggestion.field)) return { ok: false, reason: "unknown_field" };

  if (screenRequest(text).verdict !== "allow") {
    return { ok: false, reason: "guardrail" };
  }

  if (suggestion.basis.kind === "common_option") {
    return COMMON_OPTIONS[suggestion.field].includes(text)
      ? { ok: true }
      : { ok: false, reason: "not_a_common_option" };
  }

  const quote = normalize(suggestion.basis.quote);
  if (quote.length === 0) return { ok: false, reason: "empty_quote" };
  return normalize(statement).includes(quote)
    ? { ok: true }
    : { ok: false, reason: "quote_not_in_statement" };
}

export interface FollowUp {
  field: FieldKey;
  question: string;
  options: string[];
}

const QUESTIONS: Record<FieldKey, string> = {
  when: "いつ頃のことですか？ 分からなければ、そのままで大丈夫です。",
  where: "どこでのことですか？ 言いにくければ、飛ばして大丈夫です。",
  what: "どんなことで、困っていますか？ 当てはまるものがあれば、選んでください。",
  help: "どんなふうに、助けてほしいですか？ まだ分からなくても、大丈夫です。",
};

/** 抜けている項目への質問。全部に答えなくてよい。 */
export function followUpQuestions(card: ProblemCard): FollowUp[] {
  return missingFields(card).map((field) => ({
    field,
    question: QUESTIONS[field],
    options: COMMON_OPTIONS[field],
  }));
}

/** 「これでいいですか？」の文面。候補であること、選ぶのは本人であることを、明示する。 */
export function confirmPrompt(suggestion: Suggestion): string {
  return `「${suggestion.text.trim()}」という理解で、合っていますか？（これは候補です。合っていれば選んでください。違えば、言い直してください。）`;
}
