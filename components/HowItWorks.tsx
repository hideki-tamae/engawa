"use client";

import HowHero from "@/components/HowHero";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Step } from "@/lib/demo";
import { IconBack, IconCheck, IconShield, IconUndo } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import type { TrialSummary } from "@/lib/trial";
import type { EvalReport } from "@/lib/evals";

export default function HowItWorks() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [error, setError] = useState(false);
  const [run, setRun] = useState(0);
  const [evals, setEvals] = useState<EvalReport | null>(null);
  const [live, setLive] = useState<{ report: EvalReport; adopted: number; total: number; avgMs: number; cached?: boolean } | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [trial, setTrial] = useState<(TrialSummary & { enough: boolean }) | null>(null);

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

  useEffect(() => {
    let alive = true;
    fetch("/api/trial/summary")
      .then((r) => r.json())
      .then((j) => alive && setTrial(j))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/evals")
      .then((r) => r.json())
      .then((j) => alive && setEvals(j))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function runLive() {
    setLiveBusy(true);
    setLiveErr(null);
    const r = await fetch("/api/evals/live", { method: "POST" }).catch(() => null);
    setLiveBusy(false);
    if (!r || !r.ok) return setLiveErr(r?.status === 429 ? "回数の上限です。しばらくしてから、お試しください。" : "実行できませんでした。");
    setLive(await r.json());
  }

  const total = steps?.reduce((n, s) => n + s.checks.length, 0) ?? 0;
  const passed = steps?.reduce((n, s) => n + s.checks.filter((c) => c.ok).length, 0) ?? 0;
  const allOk = steps !== null && passed === total;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
        <IconBack className="h-4 w-4" />
        手帳にもどる
      </Link>
      <div className="mt-2">
        <HowHero />
      </div>
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

          <section className="mt-10 rounded-3xl border border-line bg-paper p-5 shadow-soft" aria-labelledby="evals-h">
            <h2 id="evals-h" className="text-xl font-bold">AI の制御のテスト（Evals）</h2>
            <p className="mt-1 text-sm leading-7 text-muted">
              診断・点数づけ・責める文面・個人情報・攻撃（「指示を無視して」など）に、制御が効いているかを、自動で確かめています。
            </p>
            {evals ? (
              <>
                <p className="mt-4 text-3xl font-bold tabular-nums">
                  {evals.passed} <span className="text-xl font-semibold text-muted">/ {evals.total}</span>
                  <span className="ml-2 text-base font-semibold text-muted">件が、通りました</span>
                </p>
                <ul className="mt-3 space-y-2">
                  {evals.byCategory.map((c) => (
                    <li key={c.category} className="flex items-center justify-between gap-3 rounded-2xl bg-paper-2 px-4 py-2.5 text-sm">
                      <span>{c.category}</span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {c.passed}/{c.total}
                      </span>
                    </li>
                  ))}
                </ul>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-wood-dark underline underline-offset-4">1件ずつ見る</summary>
                  <ul className="mt-2 space-y-1.5 text-sm leading-6">
                    {evals.cases.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <span aria-label={c.ok ? "通った" : "通らなかった"} role="img" className={c.ok ? "text-ok" : "text-warn"}>
                          {c.ok ? "✓" : "✗"}
                        </span>
                        <span>{c.desc}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="mt-4 text-muted">動かしています…</p>
            )}
            <div className="mt-5 rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold">実際の AI（Gemini）で、12件ためす</p>
              <p className="mt-1 text-xs leading-6 text-muted">
                AI は、毎回、違う答えを返します。そこで、「検証を通った出力だけが画面に出るか」と、「AI の案が採用された割合」を、別々に出します。
              </p>
              <Button variant="quiet" className="mt-3 w-full" onClick={runLive} disabled={liveBusy}>
                {liveBusy ? "ためしています…（30秒ほど）" : live ? "結果を見なおす" : "ためす"}
              </Button>
              {liveErr && (
                <p role="alert" className="mt-2 text-sm text-warn">
                  {liveErr}
                </p>
              )}
              {live && (
                <div className="mt-3 text-sm leading-7" role="status">
                  <p>
                    検証を通った出力だけが画面に出た：<strong className="tabular-nums">{live.report.passed}/{live.total}</strong>
                  </p>
                  <p>
                    AI の案が採用された：<strong className="tabular-nums">{live.adopted}/{live.total}</strong>
                    （残りは、検証で外され、固定の質問に戻った）
                  </p>
                  <p>平均の応答時間：{live.avgMs} ミリ秒{live.cached ? "（直近の結果を表示）" : ""}</p>
                </div>
              )}
            </div>
          </section>

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
                        role="img"
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

          <section className="mt-10 rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <h2 className="text-xl font-bold">試用の結果</h2>
            <p className="mt-1 text-sm leading-7 text-muted">
              試用のリンクから入った人の、操作にかかった時間と、最後まで進めたかだけの集計です。言葉や内容は、記録していません。
            </p>
            {trial && trial.enough ? (
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-paper-2 p-3">
                  <dt className="text-xs text-muted">試した人</dt>
                  <dd className="text-2xl font-bold tabular-nums">{trial.started}</dd>
                </div>
                <div className="rounded-2xl bg-paper-2 p-3">
                  <dt className="text-xs text-muted">最後まで進んだ人</dt>
                  <dd className="text-2xl font-bold tabular-nums">{Math.round((trial.completionRate ?? 0) * 100)}%</dd>
                </div>
                <div className="rounded-2xl bg-paper-2 p-3">
                  <dt className="text-xs text-muted">手帳ができるまで（中央値）</dt>
                  <dd className="text-2xl font-bold tabular-nums">{trial.medianSeconds}秒</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl bg-paper-2 p-4 text-base leading-7">まだ数値が出ていません。（3人以上が試すと、ここに出ます。）</p>
            )}
          </section>

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
