"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit-chain";
import type { SharedView } from "@/lib/handoff";

const FIELD_LABEL: Record<string, string> = { what: "どんなこと", when: "いつ頃", where: "どこで", help: "してほしいこと" };
const EVENT: Record<string, string> = {
  card_created: "カードを作りました",
  shared: "あなたが共有しました",
  read_back: "窓口がカードを開きました",
  confirmed: "読み返して、あなたが「合っている」と答えました",
  corrected: "読み返して、あなたが「違う」と答えました",
  handoff: "次の窓口へ引き継がれました",
  withdrawn: "あなたが取り下げました",
};

interface Mine {
  withdrawn: boolean;
  view: SharedView;
  log: AuditEntry[];
  chain: { ok: boolean };
}

export default function MyCard({ token }: { token: string }) {
  const [data, setData] = useState<Mine | null>(null);
  const [missing, setMissing] = useState(false);

  const [version, setVersion] = useState(0);

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
  }, [token, version]);

  async function withdraw() {
    if (!confirm("取り下げると、窓口はこのカードを見られなくなります。よろしいですか？")) return;
    await fetch(`/api/cards/${token}`, { method: "POST", body: JSON.stringify({ action: "withdraw" }) });
    setVersion((v) => v + 1);
  }

  if (missing) return <p className="mx-auto max-w-xl p-6 text-lg">カードが見つかりません。</p>;
  if (!data) return <p className="mx-auto max-w-xl p-6">読み込み中…</p>;

  return (
    <section className="mx-auto w-full max-w-xl px-5 py-10 text-[#2d2418]">
      <h1 className="text-2xl font-semibold">あなたのカード</h1>
      <p className="mt-2 text-sm text-[#5b4a33]">
        いつ、誰が見たかを、ここで確認できます。いつでも取り下げられます。
      </p>
      <dl className="mt-5 space-y-3 rounded-2xl bg-[#f3ead9] p-5">
        <div>
          <dt className="text-sm text-[#5b4a33]">あなたの言葉</dt>
          <dd className="mt-1 text-lg leading-8">{data.view.statement}</dd>
        </div>
        {Object.entries(data.view.fields).map(([k, f]) => (
          <div key={k}>
            <dt className="text-sm text-[#5b4a33]">{FIELD_LABEL[k] ?? k}</dt>
            <dd className="mt-1 text-lg">{f?.value}</dd>
          </div>
        ))}
      </dl>
      {data.withdrawn ? (
        <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-base">
          取り下げ済みです。窓口は、このカードを見られません。
        </p>
      ) : (
        <button
          type="button"
          onClick={withdraw}
          className="mt-5 rounded-full border border-[#7a5a2f]/50 px-5 py-2 text-base hover:bg-[#7a5a2f]/10"
        >
          取り下げる
        </button>
      )}
      <h2 className="mt-8 text-lg font-medium">経過の記録</h2>
      <p className="text-sm text-[#5b4a33]">
        改ざん検知：{data.chain.ok ? "異常なし" : "異常あり"}（本文は記録に含みません）
      </p>
      <ol className="mt-2 space-y-1 text-base">
        {data.log.map((e) => (
          <li key={e.seq}>
            {e.seq + 1}. {EVENT[e.type] ?? e.type}
            {e.type === "read_back" && e.detail.window ? `（${String(e.detail.window)}）` : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
