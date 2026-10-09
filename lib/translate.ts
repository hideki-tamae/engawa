import { accessToken } from "./llm";

/**
 * 英語版の表示のための、画面の文字の翻訳（日本語 → 英語）。
 * 画面に出ている文字だけを、翻訳する。保存しない（この翻訳の入れものは、メモリだけ。再起動で消える）。
 */
export const JP = /[぀-ヿ㐀-鿿]/;
export const MAX_ITEMS = 40;
export const MAX_ITEM_CHARS = 300;

export function validateShort(input: unknown): boolean {
  return typeof input === "object" && input !== null && (input as { short?: unknown }).short === true;
}

export function validateTexts(input: unknown): string[] | null {
  if (typeof input !== "object" || input === null) return null;
  const t = (input as { texts?: unknown }).texts;
  if (!Array.isArray(t) || t.length === 0 || t.length > MAX_ITEMS) return null;
  if (!t.every((x) => typeof x === "string" && x.length > 0 && x.length <= MAX_ITEM_CHARS && JP.test(x))) return null;
  return t as string[];
}

const SYSTEM = `You translate UI strings of a Japanese care-support web app ("Engawa", a handbook that lets a person carry their own words from one service window to the next) into natural, warm, plain English.
Rules: keep meaning exact; keep it short like UI copy; keep punctuation style simple; keep proper nouns (Engawa, Google, Gemini); do not add explanations; "窓口" = "service window" (government/hospital/school/support organization counter); "手帳" = "handbook"; "縁側" on its own = "Veranda" (it follows the brand name Engawa, so do not repeat Engawa).
Input: JSON array of strings. Output: JSON array of translated strings, same length and order, nothing else.`;

const SHORT = `

IMPORTANT: every string is a tiny label inside a diagram. Translate to the shortest natural English: at most about 14 characters, abbreviate if needed (e.g. "Window", "Again", "Handbook", "1st time").`;

const memory = new Map<string, string>();

export async function translateTexts(texts: string[], short = false): Promise<string[]> {
  const project = process.env.VERTEX_PROJECT;
  const k = (t: string) => (short ? `s:${t}` : t);
  const need = texts.filter((t) => !memory.has(k(t)));
  if (need.length > 0 && project) {
    try {
      const token = await accessToken();
      const res = await fetch(
        `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${process.env.VERTEX_MODEL ?? "gemini-2.5-flash"}:generateContent`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: short ? SYSTEM + SHORT : SYSTEM }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(need) }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 6000, thinkingConfig: { thinkingBudget: 0 } },
          }),
          signal: AbortSignal.timeout(25_000),
        },
      );
      if (res.ok) {
        const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
        const raw = (j.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr) && arr.length === need.length && arr.every((x) => typeof x === "string")) {
          need.forEach((t, i) => memory.set(k(t), (arr[i] as string).trim() || t));
          if (memory.size > 5000) memory.delete(memory.keys().next().value as string);
        }
      }
    } catch {
      /* 失敗したら、日本語のまま */
    }
  }
  return texts.map((t) => memory.get(k(t)) ?? t);
}
