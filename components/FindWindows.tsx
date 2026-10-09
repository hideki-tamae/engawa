"use client";

import { useState } from "react";
import { IconArrow, IconCheck, IconLock, IconSpark } from "@/components/icons";
import { Button, Notice } from "@/components/ui";

export interface Found {
  name: string;
  kind: string;
  what: string;
  url?: string;
  verified: boolean;
  searchUrl?: string;
}

/**
 * 次の相談先を探す（エージェント）。本人が押したときだけ動く。
 * 送るのは、選んだ「困りごとの種類」と、任意の市区町村だけ。あなたの言葉は、送らない。
 * AI が探した候補は、リンク先を実際に開いて確かめ、確かめられたものだけリンクを出す。
 */
export default function FindWindows({
  whats,
  helps,
  audience = "person",
  embedded = false,
  onPick,
  pickedName,
}: {
  whats: string[];
  helps: string[];
  audience?: "person" | "window";
  embedded?: boolean;
  onPick?: (c: Found) => void;
  pickedName?: string;
}) {
  const [area, setArea] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "bad">("idle");
  const [items, setItems] = useState<Found[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  async function run() {
    setState("busy");
    const r = await fetch("/api/find", { method: "POST", body: JSON.stringify({ whats, helps, area: area.trim() || undefined }) }).catch(() => null);
    if (!r) return setState("error");
    if (r.status === 422) return setState("bad");
    if (!r.ok) return setState("error");
    const j = (await r.json()) as { candidates: Found[]; checkedAt: string };
    setItems(j.candidates);
    setCheckedAt(j.checkedAt);
    setState("done");
  }

  return (
    <section className={embedded ? "mt-3" : "mt-10 rounded-3xl border border-line bg-paper p-5 shadow-soft"} aria-labelledby="find-h">
      <h2 id="find-h" className={`flex items-center gap-2 text-lg font-bold ${embedded ? "sr-only" : ""}`}>
        <IconSpark className="h-5 w-5 text-wood" />
        次の相談先を探す
      </h2>
      <p className="mt-1 text-sm leading-7 text-muted">
        AI（Gemini）が、公式サイトから、相談できる窓口の候補を探します。押したときだけ、動きます。
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted">
        <IconLock className="mt-1 h-4 w-4 shrink-0" />
        {audience === "window"
          ? "送るのは、本人が見せた「困りごとの種類」と、下の市区町村（任意）だけです。本人の言葉は、送りません。"
          : "送るのは、あなたが選んだ「困りごとの種類」と、下の市区町村（任意）だけです。あなたの言葉は、送りません。"}
      </p>

      <label htmlFor="area" className="mt-4 block text-sm font-semibold">
        お住まいの市区町村（任意）
      </label>
      <input
        id="area"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        maxLength={20}
        placeholder="たとえば「新宿区」"
        className="mt-1 w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base placeholder:text-muted/50 focus:border-wood focus:outline-none"
      />
      <Button variant="quiet" className="mt-4 w-full" onClick={run} disabled={state === "busy"}>
        {state === "busy" ? "公式サイトを探して、リンクを確かめています…" : state === "done" ? "もう一度、探す" : "探す"}
        {state !== "busy" && <IconArrow className="h-5 w-5" />}
      </Button>
      {state === "busy" && (
        <p role="status" aria-live="polite" className="mt-2 text-center text-sm text-muted">
          20秒ほど、かかることがあります。
        </p>
      )}

      {state === "bad" && (
        <div className="mt-4">
          <Notice tone="warn" role="alert">
            市区町村は、漢字・ひらがな・カタカナで、入れてください。
          </Notice>
        </div>
      )}
      {state === "error" && (
        <div className="mt-4">
          <Notice tone="info" role="alert">
            探せませんでした。お住まいの市区町村の公式サイトで、「生活 相談 窓口」などと、検索してみてください。
          </Notice>
        </div>
      )}

      {state === "done" && (
        <div className="mt-5">
          {items.length === 0 ? (
            <Notice tone="info" role="status">
              確かな候補が、見つかりませんでした。お住まいの市区町村の公式サイトで、「生活 相談 窓口」などと、検索してみてください。
            </Notice>
          ) : (
            <ul className="space-y-3">
              {items.map((c) => (
                <li key={c.name} className="rounded-2xl border border-line bg-paper-2/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold">{c.name}</p>
                    <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs text-muted">{c.kind}</span>
                    {c.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-ok">
                        <IconCheck className="h-3.5 w-3.5" />
                        リンクを確認済み
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-7 text-ink">{c.what}</p>
                  {c.verified && c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 items-center text-base font-semibold text-wood-dark underline underline-offset-4"
                    >
                      公式ページを開く
                      <span className="sr-only">（新しいタブで開きます）</span>
                    </a>
                  ) : (
                    <div className="mt-2 text-sm leading-6 text-muted">
                      <p>ページのリンクは、確認できませんでした。</p>
                      {c.searchUrl && (
                        <a
                          href={c.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex min-h-11 items-center text-base font-semibold text-wood-dark underline underline-offset-4"
                        >
                          公式サイトの中で「{c.name}」を検索する
                          <span className="sr-only">（検索結果が、新しいタブで開きます）</span>
                        </a>
                      )}
                    </div>
                  )}
                  {onPick && (
                    <Button
                      variant={pickedName === c.name ? "primary" : "quiet"}
                      className="mt-3 w-full"
                      onClick={() => onPick(c)}
                    >
                      {pickedName === c.name ? (
                        <>
                          <IconCheck className="h-5 w-5" />
                          引き継ぎ先に、選んでいます
                        </>
                      ) : (
                        "ここを、引き継ぎ先にする"
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-6 text-muted">
            AI が探し、リンク先を実際に開いて確かめました
            {checkedAt ? `（${new Date(checkedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}）` : ""}。
            窓口の受付時間や電話番号は、必ず公式ページで確認してください。この候補は、選ぶまで、保存も共有もされません。
          </p>
        </div>
      )}
    </section>
  );
}
