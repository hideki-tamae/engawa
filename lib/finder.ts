import { SAFETY_OPTION, WHAT_MORE } from "./suggestions";
import { screenInput, screenRequest } from "./guardrails";

/**
 * 次の相談先を探すエージェント。
 * 流れ：本人が選んだ「困りごとの種類」（選択肢だけ。本人の言葉は送らない）＋任意の市区町村
 *       → AI が Google 検索で、公的な窓口の候補を探す
 *       → システムが、(1) 公的なドメインか (2) そのページを実際に開けるか (3) 内容が名前と合うか、を確かめる
 *       → 確かめられたものだけ、リンクつきで出す。確かめられないものは、リンクを出さない。
 * 本人が選ぶまで、何も保存・共有しない。
 */
export interface FinderInput {
  helps: string[];
  whats: string[];
  area?: string;
}

export interface Candidate {
  name: string;
  kind: string;
  what: string;
  url?: string;
  verified: boolean;
  /** 確かめられなかった理由（画面には出さず、ログに使う） */
  reason?: "domain" | "http" | "mismatch" | "timeout" | "no_url";
  /** 確かめたときの HTTP の状態（ログ用） */
  status?: number;
  /** 確かめられなかったとき：その公式サイトの中で、窓口の名前を検索するリンク（ページではなく、検索） */
  searchUrl?: string;
}

export type FindOutcome = { ok: true; candidates: Candidate[]; checkedAt: string } | { ok: false; reason: "invalid_input" | "no_model" | "model_failed" };

export type Generate = (system: string, user: string) => Promise<string>;
export interface Source { title: string; uri: string }
export type GenerateGrounded = (system: string, user: string) => Promise<{ text: string; sources: Source[] }>;
export type ResolveSource = (uri: string) => Promise<string | null>;
export type FetchPage = (url: string) => Promise<{ ok: boolean; status: number; text: string } | null>;

const KINDS = ["市区町村", "都道府県", "国"] as const;
const HELPS = ["話を聞いてほしい", "手続きを一緒にしてほしい", "どこに相談すればよいか知りたい", "代わりに伝えてほしい", "まだ分からない"];
const WHATS = ["お金のこと", "住まいのこと", "仕事・学校のこと", "家族のこと", "体や心の調子", "手続きが分からない", SAFETY_OPTION, ...WHAT_MORE];

/** 公的な窓口のドメインだけ。IPアドレスや、似せた名前は通さない。 */
export function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (/^\d+(\.\d+){3}$/.test(h) || h.includes(":")) return false;
  if (/(^|\.)lg\.jp$/.test(h) || /(^|\.)go\.jp$/.test(h)) return true;
  if (/^(www\.)?(city|town|vill|pref)\.[a-z0-9-]+(\.[a-z0-9-]+)*\.jp$/.test(h)) return true;
  if (/^(www\.)?houterasu\.or\.jp$/.test(h)) return true;
  return false;
}

export function safeUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > 300) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    return isAllowedHost(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

export function validateInput(input: unknown): { ok: true; value: FinderInput } | { ok: false } {
  if (typeof input !== "object" || input === null) return { ok: false };
  const o = input as Record<string, unknown>;
  const arr = (v: unknown, allowed: string[]) =>
    Array.isArray(v) && v.length <= 6 && v.every((x) => typeof x === "string" && allowed.includes(x)) ? (v as string[]) : null;
  const helps = arr(o.helps ?? [], HELPS);
  const whats = arr(o.whats ?? [], WHATS);
  if (!helps || !whats) return { ok: false };
  let area: string | undefined;
  if (o.area !== undefined && o.area !== "") {
    if (typeof o.area !== "string" || o.area.length > 20 || !/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u.test(o.area)) return { ok: false };
    if (screenInput(o.area).verdict !== "allow") return { ok: false };
    area = o.area.trim();
  }
  return { ok: true, value: { helps, whats, area } };
}

const SYSTEM = `あなたは、日本の公的な相談窓口を、公式サイトの情報だけを根拠に探す調査役です。
守ること：推測で書かない。電話番号・メールアドレス・住所は書かない。民間の会社や団体は入れない。診断や評価はしない。
出力は、JSON の配列だけ。各要素は {"name":"窓口の名前","kind":"市区町村|都道府県|国","what":"相談できること（1文）","url":"公式ページのURL"}。最大5件。`;

export function buildPrompt(i: FinderInput): string {
  const where = i.area ? `${i.area}で` : "日本で";
  const topics = i.whats.length ? i.whats.join("、") : "生活や家族の困りごと全般";
  const wants = i.helps.length ? `（${i.helps.join("、")}）` : "";
  return `${where}、「${topics}」${wants}について相談できる、公的な窓口（市区町村・都道府県・国の機関）を、公式サイトの情報だけを根拠に、最大5件。`;
}

/** 公式サイトの名前（ドメイン）は、AI が返したものを使い、中身（パス）は使わない。名前で、サイト内を検索するリンクにする。 */
export function siteSearchUrl(host: string, name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${host} ${name}`)}`;
}

export function parseCandidates(text: string): { name: string; kind: string; what: string; url: string }[] {
  const body = text.replace(/```(?:json)?/g, "").trim();
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  try {
    const arr = JSON.parse(body.slice(start, end + 1)) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: { name: string; kind: string; what: string; url: string }[] = [];
    for (const x of arr.slice(0, 6)) {
      if (typeof x !== "object" || x === null) continue;
      const o = x as Record<string, unknown>;
      if (typeof o.name !== "string" || typeof o.what !== "string") continue;
      const name = o.name.trim().slice(0, 40);
      const what = o.what.trim().slice(0, 120);
      if (!name || !what) continue;
      // 診断・評価・推測・責める表現が混じったものは、捨てる
      if (screenRequest(`${name} ${what}`).verdict === "refuse") continue;
      const kind = typeof o.kind === "string" && (KINDS as readonly string[]).includes(o.kind) ? o.kind : "その他";
      out.push({ name, kind, what, url: typeof o.url === "string" ? o.url : "" });
    }
    return out;
  } catch {
    return [];
  }
}

/** 名前の3文字ずつの並びが、ページの中に2つ以上あれば、合っているとみなす。 */
export function nameMatchesPage(name: string, pageText: string, min = 2): boolean {
  const n = name.replace(/[\s　（）()「」]/g, "");
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= n.length; i++) grams.add(n.slice(i, i + 3));
  let hit = 0;
  for (const g of grams) if (pageText.includes(g)) hit++;
  return hit >= min;
}

export async function findWindows(
  input: FinderInput,
  deps: { generate: Generate | null; generateGrounded?: GenerateGrounded | null; guard?: { response(text: string): Promise<"ok" | "flagged" | "unavailable"> } | null; resolveSource?: ResolveSource; fetchPage: FetchPage; now?: () => Date },
): Promise<FindOutcome> {
  if (!deps.generate && !deps.generateGrounded) return { ok: false, reason: "no_model" };
  let raw: string;
  let sources: Source[] = [];
  try {
    if (deps.generateGrounded) {
      const g = await deps.generateGrounded(SYSTEM, buildPrompt(input));
      raw = g.text;
      sources = g.sources;
    } else raw = await deps.generate!(SYSTEM, buildPrompt(input));
  } catch {
    return { ok: false, reason: "model_failed" };
  }
  // AIが返した文に、攻撃文が混ざっていたら、使わない
  if (deps.guard && (await deps.guard.response(raw)) === "flagged") return { ok: false, reason: "model_failed" };
  let parsed = parseCandidates(raw);
  // 検索つきの回答は、たまにJSONにならない。そのときは、1回だけ、やり直す
  if (parsed.length === 0 && deps.generateGrounded) {
    try {
      const g2 = await deps.generateGrounded(SYSTEM, buildPrompt(input));
      parsed = parseCandidates(g2.text);
      if (parsed.length) sources = g2.sources;
    } catch {
      /* 1回目の結果のまま */
    }
  }
  const results: Candidate[] = [];
  const seen = new Set<string>();
  await Promise.all(
    parsed.map(async (c, idx) => {
      const u = safeUrl(c.url);
      let cand: Candidate;
      if (!c.url) cand = { ...c, url: undefined, verified: false, reason: "no_url" };
      else if (!u) return; // 公的でないドメインは、名前ごと捨てる
      else {
        const page = await deps.fetchPage(u.toString()).catch(() => null);
        const searchUrl = siteSearchUrl(u.hostname, c.name);
        if (!page) cand = { ...c, url: undefined, verified: false, reason: "timeout", searchUrl };
        else if (!page.ok) cand = { ...c, url: undefined, verified: false, reason: "http", status: page.status, searchUrl };
        else if (!nameMatchesPage(c.name, page.text)) cand = { ...c, url: undefined, verified: false, reason: "mismatch", searchUrl };
        else cand = { ...c, url: u.toString(), verified: true };
      }
      if (seen.has(cand.name)) return;
      seen.add(cand.name);
      results[idx] = cand;
    }),
  );
  // AIが書いたURLで確認できなかった候補は、検索の根拠として返ったページ（実在する）から探す
  const pool = await loadSourcePages(sources, deps.resolveSource ?? resolveGroundingRedirect, deps.fetchPage);
  if (pool.length) {
    for (let i = 0; i < results.length; i++) {
      const cand = results[i];
      if (!cand || cand.verified) continue;
      const hit = pool.find((p) => nameMatchesPage(cand.name, p.text, 3));
      if (hit) results[i] = { ...cand, url: hit.url, verified: true, reason: undefined, status: undefined, searchUrl: undefined };
    }
  }
  const ordered = results.filter(Boolean).sort((a, b) => Number(b.verified) - Number(a.verified)).slice(0, 3);
  return { ok: true, candidates: ordered, checkedAt: (deps.now?.() ?? new Date()).toISOString() };
}

const REDIRECT_PREFIX = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/";

/** 検索の根拠として返る転送用URLから、転送先（公的なドメインだけ）を取り出す。転送用URL以外は、開かない。 */
export const resolveGroundingRedirect: ResolveSource = async (uri) => {
  if (!uri.startsWith(REDIRECT_PREFIX)) return null;
  const res = await fetch(uri, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  const loc = res.headers.get("location");
  const u = loc ? safeUrl(new URL(loc, uri).toString()) : null;
  return u ? u.toString() : null;
};

/** 根拠のページのうち、公的なドメインで、実際に開けて、中身が読めたものだけを集める（最大8件）。 */
async function loadSourcePages(sources: Source[], resolve: ResolveSource, fetchPage: FetchPage): Promise<{ url: string; text: string }[]> {
  const cand = sources.filter((x) => isAllowedHost(x.title)).slice(0, 8);
  const pages = await Promise.all(
    cand.map(async (x) => {
      const url = await resolve(x.uri).catch(() => null);
      if (!url) return null;
      const page = await fetchPage(url).catch(() => null);
      return page?.ok ? { url, text: page.text } : null;
    }),
  );
  const seen = new Set<string>();
  return pages.filter((p): p is { url: string; text: string } => !!p && !seen.has(p.url) && !!seen.add(p.url));
}

/** 実際にページを開く。公的なドメインの https だけ。転送先も確かめる。小さく、短く。 */
export const fetchOfficialPage: FetchPage = async (url) => {
  const first = safeUrl(url);
  if (!first) return null;
  let current: URL = first;
  for (let hop = 0; hop < 4; hop++) {
    const res: Response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "user-agent": "Mozilla/5.0 (compatible; EngawaLinkCheck/1.0; +https://github.com/hideki-tamae/engawa)", accept: "text/html,application/xhtml+xml", "accept-language": "ja,en;q=0.5" } });
    if (res.status >= 300 && res.status < 400) {
      const loc: string | null = res.headers.get("location");
      const next: URL | null = loc ? safeUrl(new URL(loc, current).toString()) : null;
      if (!next) return null;
      current = next;
      continue;
    }
    if (!res.ok) return { ok: false, status: res.status, text: "" };
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html/i.test(ct)) return { ok: false, status: res.status, text: "" };
    const reader = res.body?.getReader();
    let text = "";
    let bytes = 0;
    const dec = new TextDecoder("utf-8");
    while (reader && bytes < 300_000) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += dec.decode(value, { stream: true });
    }
    void reader?.cancel();
    return { ok: true, status: res.status, text };
  }
  return null;
};
