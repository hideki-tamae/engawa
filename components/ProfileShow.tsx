"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@/components/icons";
import { Button } from "@/components/ui";
import { PROFILE_FIELDS } from "@/lib/profile";
import { useProfile } from "@/lib/profile-client";

/** 窓口に見せる画面で、本人が「基本情報も見せる」を選んだときだけ、表示する。1項目ずつコピーできる。 */
export default function ProfileShow() {
  const profile = useProfile();
  const [on, setOn] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  if (!profile) return null;

  return (
    <section className="mx-auto max-w-2xl px-4 pb-10 print:hidden" aria-label="基本情報">
      {!on ? (
        <div className="rounded-3xl border border-line bg-paper-2 p-5 text-center">
          <p className="text-base leading-8">名前・住所・電話番号も、見せますか？</p>
          <Button variant="quiet" className="mt-3 w-full" onClick={() => setOn(true)}>
            基本情報も見せる
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-wood bg-paper p-5">
          <h2 className="text-xl font-bold">基本情報</h2>
          <p className="mt-1 text-sm leading-7 text-muted">自分で入れたものです。このスマホの中だけにあります。</p>
          <dl className="mt-4 space-y-3">
            {PROFILE_FIELDS.filter((f) => profile[f.key]).map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 rounded-2xl bg-paper-2 p-3.5">
                <div className="min-w-0">
                  <dt className="text-sm text-muted">{f.label}</dt>
                  <dd className="break-words text-lg font-semibold">{profile[f.key]}</dd>
                </div>
                <Button
                  variant="quiet"
                  className="min-h-11 shrink-0 px-4 text-base"
                  onClick={() => {
                    void navigator.clipboard.writeText(profile[f.key] ?? "");
                    setCopied(f.key);
                    setTimeout(() => setCopied(null), 1400);
                  }}
                >
                  {copied === f.key ? <IconCheck className="h-5 w-5" /> : <IconCopy className="h-5 w-5" />}
                  {copied === f.key ? "コピーしました" : "コピー"}
                </Button>
              </div>
            ))}
          </dl>
          <Button variant="ghost" className="mt-3" onClick={() => setOn(false)}>
            基本情報を隠す
          </Button>
        </div>
      )}
    </section>
  );
}
