"use client";

import { Notice } from "@/components/ui";
import { EMERGENCY_RESOURCES, telHref } from "@/lib/guardrails";

/**
 * 「身の安全が心配」を選んだときに、すぐ出す。公的な相談先（確認できた番号だけ）と、
 * 一緒に住む人に画面を見られたときのために、すぐ閉じるボタン。
 */
export default function SafetyPanel() {
  const quickExit = () => {
    try {
      sessionStorage.clear();
    } catch {
      /* 何もしない */
    }
    window.location.replace("https://www.jma.go.jp/");
  };
  return (
    <div className="mt-5" role="region" aria-label="安全のための案内">
      <Notice tone="warn" role="alert">
        <p className="text-lg font-bold">いま危険が迫っているときは、先に、ここへ連絡してください</p>
        <ul className="mt-3 space-y-3">
          {EMERGENCY_RESOURCES.map((r) => (
            <li key={r.contact} className="leading-7">
              <span className="block text-sm">{r.label}</span>
              <a href={telHref(r.contact)} className="inline-flex min-h-11 items-center text-2xl font-bold underline underline-offset-4">
                {r.contact}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-7">
          この手帳を作る前に、上の窓口に、先に相談してもかまいません。手帳や、この画面を、一緒に住む人に見られると危険なときは、作らないか、見られない端末で作ってください。
        </p>
        <button
          type="button"
          onClick={quickExit}
          className="mt-4 inline-flex min-h-13 w-full items-center justify-center rounded-full border-2 border-warn bg-paper px-6 text-lg font-bold text-warn focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-wood"
        >
          この画面を、すぐ閉じる
        </button>
      </Notice>
    </div>
  );
}
