"use client";

import { useEffect, useState } from "react";
import HandbookCard from "@/components/HandbookCard";
import type { SharedView } from "@/lib/handoff";
import ProfileShow from "@/components/ProfileShow";
import { Notice } from "@/components/ui";

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

  if (missing)
    return (
      <div className="p-6">
        <Notice tone="info" role="alert">
          手帳が見つかりません。
        </Notice>
      </div>
    );
  if (!data) return <p className="p-6 text-2xl text-muted">読み込んでいます…</p>;
  if (data.withdrawn)
    return (
      <div className="p-6">
        <Notice tone="warn" role="status">
          この手帳は、取り下げられています。
        </Notice>
      </div>
    );

  return (
    <>
      <section className="mx-auto max-w-2xl px-4 py-6">
        <HandbookCard statement={data.view.statement} fields={data.view.fields} large />
        <p className="mt-6 text-center text-base leading-8 text-muted">
          お手数ですが、この内容を読んでから、お話を聞いてください。
        </p>
      </section>
      <ProfileShow />
    </>
  );
}
