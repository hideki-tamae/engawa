/**
 * 試用の記録。測るのは「かかった時間」と「最後まで進めたか」だけ。
 * 本人の言葉、選んだ内容、名前、連絡先は、一切記録しない。
 * 記録するのは、試用のリンク（?trial=1）から入った人だけ。
 */
export const EVENTS = [
  "start",
  "step_write",
  "step_ask",
  "step_confirm",
  "step_scope",
  "card_created",
  "share_show",
  "share_print",
  "share_link_copy",
  "share_field_copy",
  "restart",
] as const;
export type TrialEvent = (typeof EVENTS)[number];

export interface TrialDoc {
  sid: string;
  event: TrialEvent;
  /** 「はじめる」からの経過ミリ秒 */
  t: number;
  voice?: boolean;
  skipped?: number;
  shared?: number;
  at: string;
}

export function validateTrial(input: unknown): { ok: true; value: Omit<TrialDoc, "at"> } | { ok: false } {
  if (typeof input !== "object" || input === null) return { ok: false };
  const o = input as Record<string, unknown>;
  if (typeof o.sid !== "string" || !/^[a-z0-9-]{8,40}$/.test(o.sid)) return { ok: false };
  if (typeof o.event !== "string" || !(EVENTS as readonly string[]).includes(o.event)) return { ok: false };
  if (typeof o.t !== "number" || !Number.isFinite(o.t) || o.t < 0 || o.t > 6 * 60 * 60 * 1000) return { ok: false };
  const value: Omit<TrialDoc, "at"> = { sid: o.sid, event: o.event as TrialEvent, t: Math.round(o.t) };
  if (typeof o.voice === "boolean") value.voice = o.voice;
  if (typeof o.skipped === "number" && o.skipped >= 0 && o.skipped <= 4) value.skipped = Math.round(o.skipped);
  if (typeof o.shared === "number" && o.shared >= 0 && o.shared <= 4) value.shared = Math.round(o.shared);
  return { ok: true, value };
}

export interface TrialSummary {
  started: number;
  completed: number;
  completionRate: number | null;
  medianSeconds: number | null;
  voiceRate: number | null;
  share: { show: number; print: number; link: number; fieldCopy: number };
  lastStepOfDropped: Record<string, number>;
}

const STEP_ORDER: TrialEvent[] = ["start", "step_write", "step_ask", "step_confirm", "step_scope", "card_created"];

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function summarize(docs: Pick<TrialDoc, "sid" | "event" | "t" | "voice">[]): TrialSummary {
  const bySid = new Map<string, typeof docs>();
  for (const d of docs) bySid.set(d.sid, [...(bySid.get(d.sid) ?? []), d]);
  let started = 0;
  let completed = 0;
  const durations: number[] = [];
  let voiceCount = 0;
  const share = { show: 0, print: 0, link: 0, fieldCopy: 0 };
  const dropped: Record<string, number> = {};
  for (const evs of bySid.values()) {
    if (!evs.some((e) => e.event === "start")) continue;
    started++;
    const done = evs.find((e) => e.event === "card_created");
    if (evs.some((e) => e.voice)) voiceCount++;
    if (done) {
      completed++;
      durations.push(done.t);
    } else {
      const last = STEP_ORDER.filter((s) => evs.some((e) => e.event === s)).pop() ?? "start";
      dropped[last] = (dropped[last] ?? 0) + 1;
    }
    if (evs.some((e) => e.event === "share_show")) share.show++;
    if (evs.some((e) => e.event === "share_print")) share.print++;
    if (evs.some((e) => e.event === "share_link_copy")) share.link++;
    if (evs.some((e) => e.event === "share_field_copy")) share.fieldCopy++;
  }
  const med = median(durations);
  return {
    started,
    completed,
    completionRate: started ? completed / started : null,
    medianSeconds: med === null ? null : Math.round(med / 1000),
    voiceRate: started ? voiceCount / started : null,
    share,
    lastStepOfDropped: dropped,
  };
}

/* ---------------- 採点（6項目×5点） ---------------- */
export const RATING_ITEMS = [
  { key: "impact", label: "見た瞬間の印象", low: "ふつう", high: "思わず見入る" },
  { key: "clarity", label: "一目で分かる", low: "何のものか分からない", high: "5秒で分かる" },
  { key: "ease", label: "迷わず操作できる", low: "何度も迷った", high: "一度も迷わない" },
  { key: "outcome", label: "成果が目に見える", low: "何が変わるか見えない", high: "変わることが、はっきり見える" },
  { key: "polish", label: "仕上げの丁寧さ", low: "粗い部分が目立つ", high: "細部まで丁寧" },
  { key: "fit", label: "困っている人への合い方", low: "使いにくそう", high: "安心して使えそう" },
] as const;
export type RatingKey = (typeof RATING_ITEMS)[number]["key"];
export const ROLES = ["support", "person", "developer", "other"] as const;

export interface RatingDoc {
  scores: Record<RatingKey, number>;
  role?: (typeof ROLES)[number];
  best?: string;
  worst?: string;
  at: string;
}

export function validateRating(input: unknown): { ok: true; value: Omit<RatingDoc, "at"> } | { ok: false } {
  if (typeof input !== "object" || input === null) return { ok: false };
  const o = input as Record<string, unknown>;
  const sc = o.scores as Record<string, unknown> | undefined;
  if (!sc || typeof sc !== "object") return { ok: false };
  const scores = {} as Record<RatingKey, number>;
  for (const it of RATING_ITEMS) {
    const v = sc[it.key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) return { ok: false };
    scores[it.key] = v;
  }
  const value: Omit<RatingDoc, "at"> = { scores };
  if (typeof o.role === "string" && (ROLES as readonly string[]).includes(o.role)) value.role = o.role as (typeof ROLES)[number];
  for (const k of ["best", "worst"] as const) {
    const t = o[k];
    if (typeof t === "string" && t.trim()) {
      if (t.length > 400) return { ok: false };
      value[k] = t.trim();
    }
  }
  return { ok: true, value };
}
