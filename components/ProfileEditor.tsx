"use client";

import { useState } from "react";
import { IconLock } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { PROFILE_FIELDS, type Profile } from "@/lib/profile";
import { clearProfile, saveProfile, useProfile } from "@/lib/profile-client";

/** 窓口で毎回書く基本情報を、この端末にだけ残しておく。任意。サーバーには送らない。 */
export default function ProfileEditor() {
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setDraft({ ...(saved ?? {}) });
    setError(null);
    setEditing(true);
  };

  const save = () => {
    const r = saveProfile(draft);
    if (!r.ok) {
      setError(
        r.reason === "id_number"
          ? "マイナンバーや、身分証の番号のような長い数字は、入れないでください。電話番号や住所だけで大丈夫です。"
          : "保存できませんでした。入力を確かめてください。",
      );
      return;
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="rounded-3xl border border-line bg-paper-2 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <IconLock className="h-5 w-5 text-wood" />
          基本情報（任意）
        </h2>
        <p className="mt-2 text-base leading-8">
          窓口で毎回書く、名前・住所・電話番号を、このスマホの中だけに残せます。
          <br />
          ほかには送りません。見せるかどうかは、見せるときに選べます。
        </p>
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
      {error && (
        <div className="mt-4">
          <Notice tone="warn" role="alert">{error}</Notice>
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="submit" className="flex-1">保存する</Button>
        <Button variant="ghost" onClick={() => setEditing(false)}>やめる</Button>
      </div>
    </form>
  );
}
