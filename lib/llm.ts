import { type Generate, geminiGenerate } from "./agent";

/**
 * 呼び出し先の選択。
 *  - Cloud Run 上：Vertex AI（実行アカウントの権限で呼ぶ。キーは持たない）
 *  - 手元：VERTEX_PROJECT と VERTEX_ACCESS_TOKEN があれば Vertex、なければ GEMINI_API_KEY（AI Studio）
 *  - どれもなければ null（固定の質問に戻る）
 */
let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (process.env.VERTEX_ACCESS_TOKEN) return process.env.VERTEX_ACCESS_TOKEN;
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const r = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(3000) },
  );
  if (!r.ok) throw new Error(`metadata ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

export function vertexGenerate(project: string, model = "gemini-2.5-flash"): Generate {
  return async (system, user) => {
    const token = await accessToken();
    const res = await fetch(
      `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 800,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error(`vertex ${res.status}`);
    const j = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    return parts.filter((x) => !x.thought).map((x) => x.text ?? "").join("");
  };
}

export function pickGenerate(): Generate | null {
  const project = process.env.VERTEX_PROJECT;
  if (project) return vertexGenerate(project, process.env.VERTEX_MODEL ?? "gemini-2.5-flash");
  const key = process.env.GEMINI_API_KEY;
  return key ? geminiGenerate(key) : null;
}
