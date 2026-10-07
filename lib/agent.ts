import { type FieldKey, FIELD_KEYS, type ProblemCard, missingFields } from "./card";
import { screenInput, screenRequest } from "./guardrails";
import { type Suggestion, followUpQuestions, validateSuggestion } from "./suggestions";

/**
 * エージェント（Gemini）。できることは2つだけ。
 *  1. 抜けている項目のうち、次に聞く1つを選び、聞き方を整える
 *  2. 本人の発言からの「引用」に基づく候補を出す（本人が選ぶまで、カードには入らない）
 * 出力は必ず検証する。検証に落ちた候補は捨て、質問は固定の文面に戻す。
 * 診断・評価・推測・個人情報は、そもそも出させない（プロンプト）うえで、出てきても通さない（検証）。
 */

export interface AgentProposal {
  field: FieldKey;
  question: string;
  suggestions: Suggestion[];
  /** gemini: モデルの出力を検証して採用 / fallback: 固定の文面 */
  source: "gemini" | "fallback";
  dropped: number;
}

export type Generate = (system: string, user: string) => Promise<string>;

const SYSTEM = `あなたは、困りごとを本人の言葉のまま整理する手助けをする。
してよいこと: 抜けている項目のうち次に聞く1つを選ぶ。やさしい質問文を作る。本人の発言の一部を「そのまま引用」して候補にする。
してはいけないこと: 診断・病名・評価・点数づけ・原因の断定・誰かを責める言い方・本人が言っていない推測・個人を特定する情報。
候補は what（どんなこと）か help（してほしいこと）の質問のときだけ出す。それ以外は suggestions を空にする。
候補の quote は、本人の発言に含まれる文字列を一字一句そのまま使うこと。含まれなければ候補を出さない。
出力はJSONのみ: {"field":"when|where|what|help","question":"...","suggestions":[{"text":"...","quote":"..."}]}`;

export async function proposeNext(
  card: ProblemCard,
  generate: Generate | null,
): Promise<AgentProposal | null> {
  const missing = missingFields(card);
  if (missing.length === 0) return null;
  const fallback = (): AgentProposal => {
    const f = followUpQuestions(card)[0];
    return { field: f.field, question: f.question, suggestions: [], source: "fallback", dropped: 0 };
  };
  if (!generate) return fallback();
  if (screenInput(card.statement).verdict === "refuse") return fallback();

  try {
    const raw = await generate(
      SYSTEM,
      `本人の発言: ${card.statement}\n抜けている項目: ${missing.join(",")}`,
    );
    const parsed = JSON.parse(raw) as {
      field?: string;
      question?: string;
      suggestions?: { text?: string; quote?: string }[];
    };
    const field = FIELD_KEYS.find((k) => k === parsed.field && missing.includes(k));
    if (!field || !parsed.question) return fallback();
    const question = parsed.question.trim();
    if (question.length > 120 || screenRequest(question).verdict !== "allow") return fallback();

    let dropped = 0;
    const suggestions: Suggestion[] = [];
    // 引用の候補は、本人の言葉で答える項目（what/help）だけ。いつ/どこは、固定の選択肢から選ぶ。
    const quoteAllowed = field === "what" || field === "help";
    if (!quoteAllowed) dropped += (parsed.suggestions ?? []).length;
    for (const s of quoteAllowed ? (parsed.suggestions ?? []) : []) {
      if (!s.text || !s.quote) {
        dropped++;
        continue;
      }
      // 画面に出す文面は、引用そのもの。モデルの言い換えは使わない（推測を混ぜないため）。
      const cand: Suggestion = { field, text: s.quote.trim(), basis: { kind: "quote", quote: s.quote } };
      if (validateSuggestion(card.statement, cand).ok) suggestions.push(cand);
      else dropped++;
    }
    return { field, question, suggestions: suggestions.slice(0, 3), source: "gemini", dropped };
  } catch {
    return fallback();
  }
}

export function geminiGenerate(apiKey: string, model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite"): Generate {
  return async (system, user) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 800 },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const j = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    return parts.filter((x) => !x.thought).map((x) => x.text ?? "").join("");
  };
}
