"use client";

import Link from "next/link";
import { useState } from "react";
import { IconBack, IconCheck } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { RATING_ITEMS, type RatingKey } from "@/lib/trial";

const ROLE_OPTIONS = [
  { v: "support", t: "相談を受ける仕事（支援職など）" },
  { v: "person", t: "相談する側の経験がある" },
  { v: "developer", t: "開発・デザインの仕事" },
  { v: "other", t: "どれでもない" },
];

export default function RateForm() {
  const [scores, setScores] = useState<Partial<Record<RatingKey, number>>>({});
  const [role, setRole] = useState("");
  const [best, setBest] = useState("");
  const [worst, setWorst] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "pii">("idle");

  const complete = RATING_ITEMS.every((i) => scores[i.key]);
  const avg = complete ? RATING_ITEMS.reduce((n, i) => n + (scores[i.key] ?? 0), 0) / RATING_ITEMS.length : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setState("sending");
    const r = await fetch("/api/ratings", {
      method: "POST",
      body: JSON.stringify({ scores, role: role || undefined, best, worst }),
    }).catch(() => null);
    if (r?.ok) setState("done");
    else if (r?.status === 422 && (await r.json().catch(() => ({}))).error === "pii") setState("pii");
    else setState("error");
  }

  if (state === "done") {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-16 text-center">
        <span className="anim-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok text-paper">
          <IconCheck className="h-9 w-9" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">ありがとうございました</h1>
        <p className="mt-3 text-base leading-8 text-muted">いただいた点数は、次の改善に使います。名前や連絡先は、記録していません。</p>
        <p className="mt-8">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
            手帳にもどる
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl px-5 pb-24 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline print:hidden">
        <IconBack className="h-4 w-4" />
        手帳にもどる
      </Link>
      <h1 className="mt-4 text-3xl font-bold">採点の1枚</h1>
      <p className="mt-2 text-base leading-8 text-muted">
        Engawa を5分ほど触ってから、感じたとおりに、つけてください。名前や連絡先は、聞きません。
      </p>

      <section className="mt-6 rounded-3xl border border-line bg-paper-2 p-5">
        <h2 className="text-lg font-bold">触ってほしいこと（作り話の例で）</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-base leading-8">
          <li>「はじめる」から、手帳を1冊つくる</li>
          <li>「窓口に画面を見せる」を開いてみる</li>
          <li>窓口のログイン画面（窓口A）で、読み返しと引き継ぎまで進めてみる</li>
        </ol>
        <p className="mt-2 text-sm leading-6 text-muted">本物の困りごとは、入れないでください。</p>
      </section>

      <div className="mt-8 space-y-8">
        {RATING_ITEMS.map((it, idx) => (
          <fieldset key={it.key}>
            <legend className="text-lg font-bold">
              {idx + 1}. {it.label}
            </legend>
            <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label={it.label}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = scores[it.key] === n;
                return (
                  <label
                    key={n}
                    className={`grid min-h-14 cursor-pointer place-items-center rounded-2xl border-2 text-xl font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-wood ${
                      on ? "border-wood bg-wood text-paper" : "border-line bg-paper hover:border-wood/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={it.key}
                      value={n}
                      checked={on}
                      onChange={() => setScores((s) => ({ ...s, [it.key]: n }))}
                      className="sr-only"
                    />
                    {n}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 flex justify-between gap-4 text-xs leading-5 text-muted">
              <span>1：{it.low}</span>
              <span className="text-right">5：{it.high}</span>
            </p>
          </fieldset>
        ))}
      </div>

      <section className="mt-10 space-y-5">
        <div>
          <label htmlFor="best" className="text-base font-bold">
            いちばん良かったところ（任意）
          </label>
          <textarea
            id="best"
            value={best}
            onChange={(e) => setBest(e.target.value)}
            rows={3}
            maxLength={400}
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-4 text-base focus:border-wood focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="worst" className="text-base font-bold">
            いちばん困ったところ・分かりにくかったところ（任意）
          </label>
          <textarea
            id="worst"
            value={worst}
            onChange={(e) => setWorst(e.target.value)}
            rows={3}
            maxLength={400}
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-4 text-base focus:border-wood focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="role" className="text-base font-bold">
            あなたは（任意）
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none"
          >
            <option value="">選ばない</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.v} value={r.v}>
                {r.t}
              </option>
            ))}
          </select>
        </div>
      </section>

      {state === "pii" && (
        <div className="mt-6">
          <Notice tone="warn" role="alert">
            感想の中に、電話番号やメールなど、個人が特定される情報があるようです。消してから、もう一度送ってください。
          </Notice>
        </div>
      )}
      {state === "error" && (
        <div className="mt-6">
          <Notice tone="warn" role="alert">
            送れませんでした。しばらくしてから、もう一度お試しください。
          </Notice>
        </div>
      )}

      <div className="mt-8 print:hidden">
        <Button type="submit" className="w-full" disabled={!complete || state === "sending"}>
          {state === "sending" ? "送っています…" : "送る"}
        </Button>
        {!complete && <p className="mt-2 text-center text-sm text-muted">6つすべてに、点数をつけると、送れます。</p>}
        {avg !== null && <p className="mt-2 text-center text-sm text-muted">平均 {avg.toFixed(1)}</p>}
      </div>
    </form>
  );
}
