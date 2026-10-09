"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const t = extractToken(link);
    if (!t) return setLinkError(true);
    const frag = link.includes("#p=") ? link.slice(link.indexOf("#p=")) : "";
    router.push(`/window/${t}${frag}`);
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

      <h2 className="mt-8 text-xl font-bold">受け取り方は、3つ</h2>
      <p className="mt-1 text-sm leading-7 text-muted">メールの登録や、アカウントは、いりません。本人が、手帳を作ったあとに、受け取れます。</p>

      <section className="mt-4 rounded-3xl border-2 border-wood bg-paper p-5 shadow-soft" aria-labelledby="o1">
        <h3 id="o1" className="flex items-center gap-3 text-lg font-bold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-wood text-base text-paper">1</span>
          QR を読み取る（いちばん簡単）
        </h3>
        <p className="mt-2 text-base leading-8">
          本人に、「窓口に画面を見せる」を開いてもらいます。<strong>画面の下に、窓口の方向けの QR</strong> があります。ご自身の端末で読み取って、ログインします。
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-paper p-5" aria-labelledby="o2">
        <h3 id="o2" className="flex items-center gap-3 text-lg font-bold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-wood text-base text-paper">2</span>
          リンクを、受け取って貼る
        </h3>
        <p className="mt-2 text-base leading-8">
          本人が、手帳の画面で「リンクをコピー」して、お使いの連絡手段（メール・メッセージなど）で、送ってくれます。受け取ったリンクを、貼ってください。
        </p>
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

      <section className="mt-4 rounded-3xl border border-line bg-paper-2 p-5" aria-labelledby="o3">
        <h3 id="o3" className="flex items-center gap-3 text-lg font-bold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-wood text-base text-paper">3</span>
          画面や紙を、見るだけ
        </h3>
        <p className="mt-2 text-base leading-8">本人の画面や紙を、そのまま読めます。<strong>ログインは、いりません。</strong>読んだら、本人に「合っていますか」と確かめてください。</p>
      </section>

      <p className="mt-6 text-sm leading-7 text-muted">
        ログインできるのは、試用に参加している窓口だけです。デモ版の窓口名は「窓口A」「窓口B」で、パスワードは、運営がお渡しします。
      </p>
    </div>
  );
}
