"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Step } from "@/lib/demo";
import { IconBack, IconCheck, IconShield, IconUndo } from "@/components/icons";
import { Button, Notice } from "@/components/ui";

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
  const allOk = steps !== null && passed === total;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
        <IconBack className="h-4 w-4" />
        手帳にもどる
      </Link>
      <h1 className="mt-4 text-4xl font-bold">仕組みを見る</h1>
      <p className="mt-3 text-base leading-8 text-muted">
        作り話の例で、実際のしくみを順に動かした結果です。見せるために作った結果ではなく、いまこの場で動かした結果を、そのまま並べています。個人の情報は、使っていません。
      </p>

      {error && (
        <div className="mt-6">
          <Notice tone="warn" role="alert">
            読み込めませんでした。しばらくしてから、もう一度お試しください。
          </Notice>
        </div>
      )}
      {!steps && !error && <p className="mt-8 text-muted">動かしています…</p>}

      {steps && (
        <>
          <div
            role="status"
            className={`anim-pop mt-8 flex items-center gap-5 rounded-3xl border p-5 ${
              allOk ? "border-ok/40 bg-ok-bg" : "border-warn/40 bg-warn-bg"
            }`}
          >
            <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${allOk ? "bg-ok text-paper" : "bg-warn text-paper"}`}>
              <IconShield className="h-9 w-9" />
            </span>
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {passed} <span className="text-xl font-semibold text-muted">/ {total}</span>
              </p>
              <p className="text-base text-muted">項目が、設計どおりに動きました</p>
            </div>
          </div>

          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="anim-fade-up rounded-3xl border border-line bg-paper p-5 shadow-soft"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <h2 className="text-xl font-bold">{s.title}</h2>
                <p className="mt-1 text-sm leading-7 text-muted">{s.why}</p>
                <ul className="mt-4 space-y-3">
                  {s.checks.map((c) => (
                    <li key={c.label} className="flex gap-3">
                      <span
                        aria-label={c.ok ? "期待どおり" : "期待と違う"}
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${c.ok ? "bg-ok text-paper" : "bg-warn text-paper"}`}
                      >
                        {c.ok ? <IconCheck className="h-4 w-4" /> : "!"}
                      </span>
                      <span className="text-base leading-7">
                        {c.label}
                        <span className="block text-sm leading-6 text-muted">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mt-8 text-center">
            <Button
              variant="quiet"
              onClick={() => {
                setSteps(null);
                setRun((n) => n + 1);
              }}
            >
              <IconUndo className="h-5 w-5" />
              もう一度、動かす
            </Button>
          </div>
          <p className="mt-6 text-xs leading-6 text-muted">
            ※ 「疑似の出力・書き換えで確認」と書いた項目は、わざと誤った状態を作り、止められるかを確かめたものです。
            <br />※ この確認は、仕組みが設計どおりに動くことを示すもので、現場での効果は、示していません。
          </p>
        </>
      )}
    </div>
  );
}
