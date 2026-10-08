"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit-chain";
import type { SharedView } from "@/lib/handoff";
import HandbookCard from "@/components/HandbookCard";
import Timeline from "@/components/Timeline";
import { IconEye, IconPhone, IconShield, IconUndo } from "@/components/icons";
import { Button, Notice, buttonClass } from "@/components/ui";

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
  const [asking, setAsking] = useState(false);

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
    await fetch(`/api/cards/${token}`, { method: "POST", body: JSON.stringify({ action: "withdraw" }) });
    setAsking(false);
    setVersion((v) => v + 1);
  }

  if (missing)
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <Notice tone="info" role="alert">
          手帳が見つかりません。保存の期限（30日）が過ぎたか、リンクが違う可能性があります。
        </Notice>
      </div>
    );
  if (!data) return <p className="mx-auto max-w-md px-5 py-16 text-muted">読み込んでいます…</p>;

  const confirmed = data.log.some((e) => e.type === "confirmed");
  const opened = data.log.filter((e) => e.type === "read_back").length;

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-8">
      <h1 className="text-3xl font-bold">あなたの手帳</h1>
      <p className="mt-2 text-base leading-8 text-muted">いつ、誰が見たかを、ここで確かめられます。いつでも取り下げられます。</p>

      <div className="mt-6">
        <HandbookCard statement={data.view.statement} fields={data.view.fields} stamp={!data.withdrawn} animateIn />
      </div>

      {data.withdrawn ? (
        <div className="mt-6">
          <Notice tone="warn" role="status">
            取り下げ済みです。窓口は、この手帳を見られません。紙の照合も、無効になります。
          </Notice>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <a href={`/show/${token}`} className={buttonClass("primary", "w-full")}>
            <IconPhone className="h-5 w-5" />
            窓口に画面を見せる
          </a>
          {asking ? (
            <Notice tone="warn" role="alert">
              <p className="font-semibold">取り下げると、窓口はこの手帳を見られなくなります。よろしいですか？</p>
              <div className="mt-3 flex gap-3">
                <Button variant="quiet" className="flex-1" onClick={() => setAsking(false)}>
                  やめる
                </Button>
                <Button variant="danger" className="flex-1" onClick={withdraw}>
                  取り下げる
                </Button>
              </div>
            </Notice>
          ) : (
            <Button variant="danger" className="w-full" onClick={() => setAsking(true)}>
              <IconUndo className="h-5 w-5" />
              取り下げる
            </Button>
          )}
        </div>
      )}

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <IconEye className="h-5 w-5 text-wood" />
          経過の記録
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
              data.chain.ok ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"
            }`}
          >
            <IconShield className="h-4 w-4" />
            改ざん検知：{data.chain.ok ? "異常なし" : "異常あり"}
          </span>
          <span className="text-muted">窓口が開いた回数：{opened}　{confirmed ? "／ 読み返し：確認済み" : ""}</span>
        </div>
        <p className="mt-2 text-sm text-muted">本文は、記録に含まれません。</p>
        <div className="mt-5">
          <Timeline log={data.log} mode="person" />
        </div>
      </section>
    </div>
  );
}
