/**
 * 運用の記録（Cloud Logging）。1行1件のJSON。Cloud Run が自動で構造化ログとして取り込む。
 * 入れてよいのは、出来事の名前・件数・判定の理由コード・所要時間だけ。
 * 本人の言葉、選んだ内容、名前、連絡先、リンクのトークンは、入れない（禁止キーは、入れても落とす）。
 */
const FORBIDDEN = /(statement|text|content|body|name|address|phone|email|message|note|token|password|code|url|link|quote)/i;

export type Severity = "INFO" | "NOTICE" | "WARNING" | "ERROR";

export function logEvent(event: string, fields: Record<string, string | number | boolean | string[]> = {}, severity: Severity = "INFO") {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (FORBIDDEN.test(k)) continue;
    safe[k] = v;
  }
  console.log(JSON.stringify({ severity, event, message: event, ...safe }));
}
