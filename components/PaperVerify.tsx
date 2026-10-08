"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconPaper } from "@/components/icons";
import { Notice } from "@/components/ui";

type Outcome = { match: true; createdAt: string } | { match: false; reason: string };

export default function PaperVerify({ token, code }: { token: string; code: string }) {
  const [r, setR] = useState<Outcome | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/cards/${token}/verify?code=${encodeURIComponent(code)}`)
      .then((x) => x.json())
      .then((j) => alive && setR(j))
      .catch(() => alive && setR({ match: false, reason: "error" }));
    return () => {
      alive = false;
    };
  }, [token, code]);

  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-wood text-paper shadow-soft">
        <IconPaper className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-3xl font-bold">紙の照合</h1>
      <p className="mt-2 text-base leading-8 text-muted">
        手元の紙に印刷された内容が、Engawa の記録と同じかを確かめます。内容そのものは、表示しません。
      </p>
      {!r && <p className="mt-8 text-muted">確認しています…</p>}
      {r?.match === true && (
        <div className="anim-pop mt-8 rounded-3xl border border-ok/40 bg-ok-bg p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok text-paper">
            <IconCheck className="h-8 w-8" />
          </span>
          <p className="mt-4 text-2xl font-bold text-ok">一致しました</p>
          <p className="mt-2 text-base leading-8 text-ink">
            この紙は、{new Date(r.createdAt).toLocaleString("ja-JP")} に作られた記録と、同じ内容です。
          </p>
        </div>
      )}
      {r?.match === false && (
        <div className="mt-8">
          <Notice tone="warn" role="alert">
            <p className="text-lg font-bold">
              {r.reason === "withdrawn" ? "本人が取り下げたため、この紙は無効です。" : "一致しませんでした。"}
            </p>
            {r.reason !== "withdrawn" && (
              <p className="mt-1 text-sm leading-7">紙の内容が書き換えられているか、コードが違います。</p>
            )}
          </Notice>
        </div>
      )}
      <p className="mt-8 text-xs leading-6 text-muted">
        ※ 一致は「紙が記録と同じ内容である」ことを示すだけで、法的な証拠力を保証するものではありません。
      </p>
    </div>
  );
}
