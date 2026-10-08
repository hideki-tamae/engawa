"use client";

import Link from "next/link";
import { useState } from "react";
import { IconBack } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { extractToken } from "@/lib/token-link";

/** 本人の携帯 → 窓口、の流れを一枚で見せる絵。 */
function Flow() {
  return (
    <svg viewBox="0 0 320 120" role="img" aria-label="本人の携帯の画面や紙を、窓口が受け取るイメージ" className="mx-auto h-auto w-full max-w-xs">
      <rect x="26" y="14" width="58" height="92" rx="12" fill="#fffdf8" stroke="#765a37" strokeWidth="3" />
      <rect x="36" y="30" width="38" height="5" rx="2.5" fill="#c9b79a" />
      <rect x="36" y="42" width="38" height="5" rx="2.5" fill="#c9b79a" />
      <rect x="36" y="54" width="26" height="5" rx="2.5" fill="#c9b79a" />
      <circle cx="55" cy="84" r="9" fill="#a8362f" />
      <text x="55" y="88.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fffdf8">縁</text>
      <text x="55" y="118" textAnchor="middle" fontSize="11" fill="#5b4a33">本人</text>
      <path d="M104 60 H196" stroke="#765a37" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
      <path d="M188 51 L200 60 L188 69" fill="none" stroke="#765a37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="150" y="44" textAnchor="middle" fontSize="11" fill="#5b4a33">画面・紙・リンク</text>
      <rect x="216" y="30" width="78" height="76" rx="8" fill="#765a37" />
      <rect x="228" y="44" width="14" height="14" rx="2" fill="#fffdf8" />
      <rect x="250" y="44" width="14" height="14" rx="2" fill="#fffdf8" />
      <rect x="272" y="44" width="14" height="14" rx="2" fill="#fffdf8" />
      <rect x="228" y="66" width="14" height="14" rx="2" fill="#fffdf8" />
      <rect x="272" y="66" width="14" height="14" rx="2" fill="#fffdf8" />
      <rect x="244" y="82" width="22" height="24" rx="3" fill="#fffdf8" />
      <path d="M216 30 L255 10 L294 30 Z" fill="#a8362f" />
      <text x="255" y="118" textAnchor="middle" fontSize="11" fill="#5b4a33">窓口</text>
    </svg>
  );
}

export default function WindowEntry() {
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const t = extractToken(link);
    if (!t) return setLinkError(true);
    window.location.href = `/window/${t}`;
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-8">
      <Link href="/for-windows" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
        <IconBack className="h-4 w-4" />
        窓口の方へ
      </Link>
      <h1 className="mt-4 text-3xl font-bold leading-snug">手帳を受け取る</h1>
      <div className="mt-5">
        <Flow />
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-paper-2 p-5" aria-labelledby="a">
        <h2 id="a" className="text-lg font-bold">画面や紙で、見せてもらったとき</h2>
        <p className="mt-2 text-base leading-8">そのまま読めます。<strong>ログインは、いりません。</strong>読んだら、本人に「合っていますか」と確かめてください。</p>
      </section>

      <section className="mt-5 rounded-3xl border-2 border-wood bg-paper p-5 shadow-soft" aria-labelledby="b">
        <h2 id="b" className="text-lg font-bold">リンクを受け取ったとき</h2>
        <p className="mt-2 text-base leading-8">リンクを貼って、開きます。<strong>ログインは、そのあとに必要なときだけ</strong>出ます。</p>
        <form onSubmit={open} className="mt-4">
          <label htmlFor="l" className="sr-only">受け取ったリンク</label>
          <input
            id="l"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setLinkError(false);
            }}
            placeholder="ここにリンクを貼る"
            className="w-full rounded-2xl border-2 border-line bg-white p-4 text-lg focus:border-wood focus:outline-none"
          />
          {linkError && (
            <div className="mt-4">
              <Notice tone="warn" role="alert">リンクの形が違うようです。本人の画面の「リンクをコピー」で取れるリンクを、貼ってください。</Notice>
            </div>
          )}
          <Button type="submit" className="mt-4 w-full" disabled={!link.trim()}>手帳を開く</Button>
        </form>
      </section>

      <p className="mt-6 text-sm leading-7 text-muted">
        ログインできるのは、試用に参加している窓口だけです。デモ版の窓口名は「窓口A」「窓口B」で、パスワードは、運営がお渡しします。
      </p>
    </div>
  );
}
