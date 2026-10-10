import dict from "./en-dict.json";
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

/** あらかじめ訳した画面の文字（scripts/build-en-dict.py で作る）。鍵は、日本語。図の中は、先頭に「s:」。個人の言葉は、入らない */
const memory = new Map<string, string>(Object.entries(dict as Record<string, string>));

async function callModel(project: string, need: string[], short: boolean): Promise<string[] | null> {
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
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const raw = (j.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr) && arr.length === need.length && arr.every((x) => typeof x === "string")) return arr as string[];
  } catch {
    /* 失敗したら、null */
  }
  return null;
}

/** 返事の数が合わないときや失敗したときは、半分に分けて、やり直す（1件の失敗で、全体が日本語のまま残らないように）。 */
async function translateChunk(project: string, need: string[], short: boolean, k: (t: string) => string): Promise<void> {
  const out = await callModel(project, need, short);
  if (out) {
    need.forEach((t, i) => memory.set(k(t), (out[i] as string).trim() || t));
    if (memory.size > 5000) memory.delete(memory.keys().next().value as string);
    return;
  }
  if (need.length <= 1) return;
  const mid = Math.ceil(need.length / 2);
  await Promise.all([translateChunk(project, need.slice(0, mid), short, k), translateChunk(project, need.slice(mid), short, k)]);
}

export async function translateTexts(texts: string[], short = false): Promise<string[]> {
  const project = process.env.VERTEX_PROJECT;
  const k = (t: string) => (short ? `s:${t}` : t);
  const need = texts.filter((t) => !memory.has(k(t)));
  if (need.length > 0 && project) await translateChunk(project, need, short, k);
  return texts.map((t) => memory.get(k(t)) ?? t);
}
