"use client";

import { useEffect, useState } from "react";
import type { SharedView } from "@/lib/handoff";

const LABEL: Record<string, string> = {
  what: "どんなこと",
  when: "いつ頃",
  where: "どこで",
  help: "してほしいこと",
};

/** 本人の携帯を窓口に向けて見せる画面。ログイン不要（本人の端末で開くため）。大きな文字、余計な操作なし。 */
export default function ShowCard({ token }: { token: string }) {
  const [data, setData] = useState<{ view: SharedView; withdrawn: boolean } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/cards/${token}/mine`)
      .then(async (r) => {
        if (!alive) return;
        if (!r.ok) setMissing(true);
        else setData(await r.json());
      })
      .catch(() => alive && setMissing(true));
    return () => {
      alive = false;
    };
  }, [token]);

  if (missing) return <p className="p-6 text-2xl">カードが見つかりません。</p>;
  if (!data) return <p className="p-6 text-2xl">読み込み中…</p>;
  if (data.withdrawn) return <p className="p-6 text-2xl">このカードは、取り下げられています。</p>;

  return (
    <section className="mx-auto max-w-2xl px-6 py-8 text-[#1f1a12]">
      <p className="text-lg text-[#5b4a33]">これは、本人が自分の言葉で書いたものです。</p>
      <p className="mt-6 text-lg text-[#5b4a33]">本人の言葉</p>
      <p className="mt-1 text-3xl leading-[1.7]">{data.view.statement}</p>
      {Object.entries(data.view.fields).map(([k, f]) => (
        <div key={k} className="mt-8">
          <p className="text-lg text-[#5b4a33]">{LABEL[k]}</p>
          <p className="mt-1 text-3xl leading-[1.6]">{f?.value}</p>
        </div>
      ))}
      <p className="mt-12 text-base text-[#5b4a33]">
        診断や評価ではありません。お手数ですが、この内容を読んでから、お話を聞いてください。
      </p>
    </section>
  );
}
