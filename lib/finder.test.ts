import { describe, expect, it } from "vitest";
import { fetchOfficialPage, findWindows, isAllowedHost, nameMatchesPage, parseCandidates, safeUrl, validateInput } from "./finder";

const text = (arr: unknown) => async () => "```json\n" + JSON.stringify(arr) + "\n```";
const pages: Record<string, { ok: boolean; status: number; text: string }> = {
  "https://www.city.example.lg.jp/a.html": { ok: true, status: 200, text: "生活支援相談窓口へご相談ください" },
  "https://www.city.example.lg.jp/old.html": { ok: false, status: 404, text: "" },
  "https://www.city.example.lg.jp/other.html": { ok: true, status: 200, text: "ごみの出し方のご案内" },
};
const fetchPage = async (u: string) => pages[u] ?? null;
const base = { helps: [], whats: ["お金のこと"] };

describe("公的なドメイン", () => {
  it("公的なものだけ通し、似せたものや IP は通さない", () => {
    expect(isAllowedHost("www.city.shinjuku.lg.jp")).toBe(true);
    expect(isAllowedHost("www.fukushi.metro.tokyo.lg.jp")).toBe(true);
    expect(isAllowedHost("www.cfa.go.jp")).toBe(true);
    expect(isAllowedHost("www.city.yokosuka.kanagawa.jp")).toBe(true);
    expect(isAllowedHost("www.houterasu.or.jp")).toBe(true);
    expect(isAllowedHost("lg.jp.evil.com")).toBe(false);
    expect(isAllowedHost("evil-go.jp.example.com")).toBe(false);
    expect(isAllowedHost("example.com")).toBe(false);
    expect(isAllowedHost("127.0.0.1")).toBe(false);
    expect(isAllowedHost("localhost")).toBe(false);
  });
  it("https・ポートなし・認証情報なしだけ", () => {
    expect(safeUrl("http://www.city.example.lg.jp/")).toBeNull();
    expect(safeUrl("https://user:pw@www.city.example.lg.jp/")).toBeNull();
    expect(safeUrl("https://www.city.example.lg.jp:8443/")).toBeNull();
    expect(safeUrl("https://www.city.example.lg.jp/a.html")?.hostname).toBe("www.city.example.lg.jp");
  });
});

describe("入力", () => {
  it("選択肢と、地名だけ。自由な文章は受け取らない", () => {
    expect(validateInput({ helps: ["話を聞いてほしい"], whats: ["お金のこと"], area: "新宿区" }).ok).toBe(true);
    expect(validateInput({ helps: ["勝手な文章"], whats: [] }).ok).toBe(false);
    expect(validateInput({ helps: [], whats: [], area: "電話 090-1234-5678" }).ok).toBe(false);
    expect(validateInput({ helps: [], whats: [], area: "x".repeat(30) }).ok).toBe(false);
    expect(validateInput({ helps: [], whats: [], area: "新宿区<script>" }).ok).toBe(false);
  });
});

describe("探して、確かめる", () => {
  it("開けて、内容が合うものだけ、リンクつきで出す", async () => {
    const r = await findWindows(base, {
      generate: text([
        { name: "生活支援相談窓口", kind: "市区町村", what: "生活の困りごとの相談。", url: "https://www.city.example.lg.jp/a.html" },
      ]),
      fetchPage,
    });
    expect(r.ok && r.candidates[0].verified).toBe(true);
    expect(r.ok && r.candidates[0].url).toBe("https://www.city.example.lg.jp/a.html");
  });
  it("ページがない（404）ものは、リンクを出さない", async () => {
    const r = await findWindows(base, {
      generate: text([{ name: "生活支援相談窓口", kind: "市区町村", what: "相談。", url: "https://www.city.example.lg.jp/old.html" }]),
      fetchPage,
    });
    expect(r.ok && r.candidates[0].verified).toBe(false);
    expect(r.ok && r.candidates[0].url).toBeUndefined();
    expect(r.ok && r.candidates[0].reason).toBe("http");
  });
  it("内容が名前と合わないものは、リンクを出さない", async () => {
    const r = await findWindows(base, {
      generate: text([{ name: "生活支援相談窓口", kind: "市区町村", what: "相談。", url: "https://www.city.example.lg.jp/other.html" }]),
      fetchPage,
    });
    expect(r.ok && r.candidates[0].reason).toBe("mismatch");
  });
  it("公的でないドメインは、名前ごと捨てる", async () => {
    const r = await findWindows(base, {
      generate: text([{ name: "格安相談サービス", kind: "市区町村", what: "相談。", url: "https://example.com/x" }]),
      fetchPage,
    });
    expect(r.ok && r.candidates).toEqual([]);
  });
  it("確かめられたものを先に並べ、最大3件", async () => {
    const r = await findWindows(base, {
      generate: text([
        { name: "古い窓口の案内", kind: "市区町村", what: "相談。", url: "https://www.city.example.lg.jp/old.html" },
        { name: "生活支援相談窓口", kind: "市区町村", what: "相談。", url: "https://www.city.example.lg.jp/a.html" },
      ]),
      fetchPage,
    });
    expect(r.ok && r.candidates[0].verified).toBe(true);
  });
  it("診断や評価の言葉が混じった候補は、捨てる。壊れた出力は、空", async () => {
    const r = await findWindows(base, {
      generate: text([{ name: "診断してください窓口", kind: "市区町村", what: "あなたは何の病気ですか。診断します。", url: "https://www.city.example.lg.jp/a.html" }]),
      fetchPage,
    });
    expect(r.ok && r.candidates).toEqual([]);
    expect(parseCandidates("not json")).toEqual([]);
    const r2 = await findWindows(base, { generate: async () => "なにも見つかりません", fetchPage });
    expect(r2.ok && r2.candidates).toEqual([]);
  });
  it("モデルがなければ、使えない。失敗しても、落ちない", async () => {
    expect((await findWindows(base, { generate: null, fetchPage })).ok).toBe(false);
    const r = await findWindows(base, { generate: async () => { throw new Error("x"); }, fetchPage });
    expect(r.ok).toBe(false);
  });
  it("名前の照合", () => {
    expect(nameMatchesPage("新宿区生活支援相談窓口", "生活支援相談窓口へご相談ください")).toBe(true);
    expect(nameMatchesPage("新宿区生活支援相談窓口", "ごみの出し方")).toBe(false);
  });
  it("公的でない URL は、取りに行かない（SSRF対策）", async () => {
    expect(await fetchOfficialPage("http://127.0.0.1:8080/")).toBeNull();
    expect(await fetchOfficialPage("https://metadata.google.internal/")).toBeNull();
  });
});
