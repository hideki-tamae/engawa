"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Step } from "@/lib/demo";

export default function HowItWorks() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [error, setError] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/demo/run")
      .then(async (r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((j) => alive && setSteps(j.steps))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [run]);

  const total = steps?.reduce((n, s) => n + s.checks.length, 0) ?? 0;
  const passed = steps?.reduce((n, s) => n + s.checks.filter((c) => c.ok).length, 0) ?? 0;

  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-10 text-[#2d2418]">
      <Link href="/" className="text-sm underline">
        ← 手帳にもどる
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">仕組みを見る</h1>
      <p className="mt-2 text-base leading-7 text-[#5b4a33]">
        作り話の例を使い、実際のしくみを順に動かした結果です。見せるために作った結果ではなく、いまこの場で動かした結果を、そのまま並べています。
        個人の情報は、使っていません。
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-3">
          読み込めませんでした。しばらくしてから、もう一度お試しください。
        </p>
      )}
      {!steps && !error && <p className="mt-6">動かしています…</p>}

      {steps && (
        <>
          <p role="status" className="mt-6 rounded-2xl border border-[#7a5a2f]/30 bg-white p-4 text-lg">
            {total} 項目のうち、<span className="font-semibold">{passed}</span> 項目が、期待どおりでした。
          </p>
          <ol className="mt-6 space-y-6">
            {steps.map((s) => (
              <li key={s.title} className="rounded-2xl bg-[#f3ead9] p-5">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#5b4a33]">{s.why}</p>
                <ul className="mt-3 space-y-2">
                  {s.checks.map((c) => (
                    <li key={c.label} className="flex gap-3 text-base leading-7">
                      <span aria-label={c.ok ? "期待どおり" : "期待と違う"} className={c.ok ? "text-green-700" : "text-red-700"}>
                        {c.ok ? "✓" : "✗"}
                      </span>
                      <span>
                        {c.label}
                        <span className="block text-sm text-[#5b4a33]">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              setSteps(null);
              setRun((n) => n + 1);
            }}
            className="mt-8 rounded-full border border-[#7a5a2f]/50 px-6 py-3 text-lg hover:bg-[#7a5a2f]/10"
          >
            もう一度、動かす
          </button>
          <p className="mt-6 text-sm text-[#5b4a33]">
            ※ 「疑似の出力・書き換えで確認」と書いた項目は、わざと誤った状態を作り、止められるかを確かめたものです。
            ※ この確認は、仕組みが設計どおりに動くことを示すもので、現場での効果は、示していません。
          </p>
        </>
      )}
    </section>
  );
}
