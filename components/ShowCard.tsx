"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HandbookCard from "@/components/HandbookCard";
import type { SharedView } from "@/lib/handoff";
import ProfileShow from "@/components/ProfileShow";
import Qr from "@/components/Qr";
import { IconBack } from "@/components/icons";
import { Notice, buttonClass } from "@/components/ui";

/** 本人の携帯を窓口に向けて見せる画面。ログイン不要（本人の端末で開くため）。大きな文字、余計な操作なし。 */
export default function ShowCard({ token }: { token: string }) {
  const [data, setData] = useState<{ view: SharedView; withdrawn: boolean; windowToken?: string } | null>(null);
  const [missing, setMissing] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

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
        <Link href="/" className={buttonClass("quiet", "mt-4 w-full")}>
          最初の画面へ
        </Link>
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
      <section className="mx-auto max-w-2xl px-4 pb-8 print:hidden" aria-labelledby="for-staff">
        <div className="rounded-3xl border-2 border-wood bg-paper p-5">
          <h2 id="for-staff" className="text-xl font-bold">窓口の方へ</h2>
          <p className="mt-1 text-base leading-8">
            記録や、次の窓口への引き継ぎは、<strong>ご自身の端末</strong>で、できます。
          </p>
          <div className="mt-3 flex items-center gap-4">
            <Qr value={`${origin}/window/${data.windowToken ?? token}`} label="読み取って、ログイン" />
            <ol className="list-decimal space-y-1.5 pl-5 text-base leading-7">
              <li>QR を、読み取る</li>
              <li>窓口のログイン</li>
              <li>本人に確かめて、引き継ぐ</li>
            </ol>
          </div>
        </div>
      </section>
      <nav className="mx-auto max-w-2xl px-4 pb-16 text-center print:hidden" aria-label="もどる">
        <a href={`/card/${token}`} className={buttonClass("quiet", "w-full")}>
          <IconBack className="h-5 w-5" />
          自分の手帳のページにもどる
        </a>
        <Link href="/" className={buttonClass("ghost", "mt-2")}>
          最初の画面へ
        </Link>
      </nav>
    </>
  );
}
