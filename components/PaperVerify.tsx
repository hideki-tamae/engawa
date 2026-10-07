"use client";

import { useEffect, useState } from "react";

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
    <section className="mx-auto w-full max-w-xl px-5 py-10 text-[#2d2418]">
      <h1 className="text-2xl font-semibold">紙の照合</h1>
      <p className="mt-2 text-sm text-[#5b4a33]">
        手元の紙に印刷された内容が、Engawa の記録と同じかを確かめます。内容そのものは表示しません。
      </p>
      {!r && <p className="mt-6">確認しています…</p>}
      {r?.match === true && (
        <p role="status" className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-4 text-lg">
          一致しました。この紙は、{new Date(r.createdAt).toLocaleString("ja-JP")} に作られた記録と、同じ内容です。
        </p>
      )}
      {r?.match === false && (
        <p role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-lg">
          {r.reason === "withdrawn"
            ? "本人が取り下げたため、この紙は無効です。"
            : "一致しませんでした。紙の内容が書き換えられているか、コードが違います。"}
        </p>
      )}
      <p className="mt-6 text-sm text-[#5b4a33]">
        ※ 一致は「紙が記録と同じ内容である」ことを示すだけで、法的な証拠力を保証するものではありません。
      </p>
    </section>
  );
}
