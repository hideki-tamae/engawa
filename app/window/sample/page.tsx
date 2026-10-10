"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sampleLang } from "@/lib/sample";

/** QR から来た人を、サンプルの手帳（作り話）に案内する。開いただけでは作らず、JS が動いたときだけ作る。 */
export default function SampleEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/sample", { method: "POST", body: JSON.stringify({ lang: sampleLang() }) })
      .then(async (r) => {
        if (!r.ok) throw new Error("sample");
        const j = (await r.json()) as { windowToken: string };
        if (alive) router.replace(`/window/${j.windowToken}`);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [router]);
  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-16 text-center">
      {failed ? (
        <>
          <p className="text-lg leading-8">用意できませんでした。しばらくしてから、もう一度お試しください。</p>
          <Link href="/window" className="mt-6 inline-flex min-h-11 items-center font-semibold text-wood-dark underline">
            手帳を受け取るページへ
          </Link>
        </>
      ) : (
        <p role="status" className="text-lg leading-8">サンプルの手帳（作り話）を、用意しています…</p>
      )}
    </div>
  );
}
