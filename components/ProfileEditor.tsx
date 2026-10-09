"use client";

import { useState } from "react";
import { IconCheck, IconLock } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { PROFILE_FIELDS, type Profile } from "@/lib/profile";
import { clearProfile, hasConsent, saveConsent, saveProfile, useProfile } from "@/lib/profile-client";

/** 窓口で毎回書く基本情報を、この端末にだけ残しておく。任意。サーバーには送らない。 */
export default function ProfileEditor() {
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const start = () => {
    setDraft({ ...(saved ?? {}) });
    setError(null);
    setAgreed(hasConsent());
    setEditing(true);
  };

  const save = () => {
    if (!agreed) {
      setError("下の「同意する」に、チェックを入れてください。");
      return;
    }
    const r = saveProfile(draft);
    if (!r.ok) {
      setError(
        r.reason === "id_number"
          ? "マイナンバーや、身分証の番号のような長い数字は、入れないでください。電話番号や住所だけで大丈夫です。"
          : "保存できませんでした。入力を確かめてください。",
      );
      return;
    }
    saveConsent(true);
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 4000);
  };

  if (!editing) {
    return (
      <div className="rounded-3xl border border-line bg-paper-2 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <IconLock className="h-5 w-5 text-wood" />
          基本情報（任意）
        </h2>
        <p className="mt-2 text-base leading-8">
          名前・住所・電話番号を、スマホの中だけに残します。
          <br />
          ほかには送りません。見せるかどうかは、そのつど選べます。
        </p>
        {justSaved && (
          <p className="mt-3 flex items-center gap-2 text-base font-bold text-ok" role="status">
            <IconCheck className="h-5 w-5" />
            保存しました
          </p>
        )}
        {saved && (
          <p className="mt-2 text-sm leading-7 text-muted">
            保存してある項目: {PROFILE_FIELDS.filter((f) => saved[f.key]).map((f) => f.label).join("、")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="quiet" onClick={start}>
            {saved ? "基本情報を直す" : "基本情報を入れておく"}
          </Button>
          {saved && (
            <Button variant="ghost" onClick={clearProfile}>
              この端末から消す
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border-2 border-wood bg-paper p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <h2 className="text-lg font-bold">基本情報（スマホの中だけ）</h2>
      <p className="mt-1 text-sm leading-7 text-muted">入れたいものだけで、だいじょうぶです。身分証の写真や、マイナンバーは、入れないでください。</p>
      {PROFILE_FIELDS.map((f) => (
        <div key={f.key} className="mt-4">
          <label htmlFor={`p-${f.key}`} className="block text-base font-semibold">
            {f.label}
          </label>
          <input
            id={`p-${f.key}`}
            value={draft[f.key] ?? ""}
            maxLength={f.max}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            autoComplete="off"
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none"
          />
        </div>
      ))}
      <details className="mt-5 rounded-2xl border border-line bg-paper-2 p-4">
        <summary className="cursor-pointer text-base font-semibold">個人情報の取り扱いについて（開く）</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-7">
          <li>入れた情報は、このスマホの中だけに保存します。ほかには送りません。</li>
          <li>窓口に見せるのは、「基本情報も見せる」を、あなたが押したときだけです。</li>
          <li>スマホをなくしたり、ほかの人が使うと、見られることがあります。画面ロックを、おすすめします。</li>
          <li>「この端末から消す」で、いつでも消せます。</li>
          <li>マイナンバーや、身分証の番号は、入れないでください。</li>
        </ul>
      </details>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-wood">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span className="text-base leading-7">上の内容を読んで、同意します。</span>
      </label>
      {error && (
        <div className="mt-4">
          <Notice tone="warn" role="alert">{error}</Notice>
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="submit" className="flex-1" disabled={!agreed}>保存する</Button>
        <Button variant="ghost" onClick={() => setEditing(false)}>やめる</Button>
      </div>
    </form>
  );
}
