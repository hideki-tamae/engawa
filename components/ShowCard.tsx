"use client";

import { useEffect, useState } from "react";
import HandbookCard from "@/components/HandbookCard";
import type { SharedView } from "@/lib/handoff";

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
    <section className="mx-auto max-w-2xl px-4 py-6">
      <HandbookCard statement={data.view.statement} fields={data.view.fields} large />
    </section>
  );
}
