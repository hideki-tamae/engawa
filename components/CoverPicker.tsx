"use client";

import { useRef, useState } from "react";
import { PRESETS, coverBackground } from "@/lib/cover";
import { loadPhoto, saveCover, useCover } from "@/lib/cover-client";
import PhotoCropper from "@/components/PhotoCropper";
import { IconCheck, IconLock } from "@/components/icons";
import { Button } from "@/components/ui";

/** 手帳のカバーを選ぶ。選んだ色や写真は、この端末の中だけに保存される。 */
export default function CoverPicker() {
  const cover = useCover();
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);

  return (
    <div className="rounded-3xl border border-line bg-paper p-5">
      <h3 className="text-lg font-bold">手帳のカバー</h3>
      <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-muted">
        <IconLock className="mt-1 h-4 w-4 shrink-0" />
        あなたの画面だけに、反映されます。写真は、この端末の中だけに保存され、送信されません。窓口に見せる画面や紙は、変わりません。
      </p>
      <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="カバーの色">
        {PRESETS.map((p) => {
          const on = cover?.kind === "preset" && cover.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={p.label}
              onClick={() => saveCover({ kind: "preset", id: p.id })}
              style={coverBackground({ kind: "preset", id: p.id })}
              className={`relative grid h-14 w-14 place-items-center rounded-2xl border-2 text-paper transition-transform active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-wood ${
                on ? "border-ink" : "border-transparent"
              }`}
            >
              {on && <IconCheck className="h-6 w-6" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{cover?.kind === "preset" ? PRESETS.find((p) => p.id === cover.id)?.label : cover?.kind === "photo" ? "写真" : "標準"}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="quiet" onClick={() => input.current?.click()}>
          写真から選ぶ
        </Button>
        {cover && (
          <Button variant="ghost" onClick={() => saveCover(null)}>
            標準にもどす
          </Button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="カバーにする写真を選ぶ"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setErr(null);
            try {
              setPhoto(await loadPhoto(f));
            } catch {
              setErr("この写真は、使えませんでした。別の写真を、お試しください。");
            }
          }}
        />
      </div>
      {photo && (
        <PhotoCropper
          bmp={photo}
          onDone={() => {
            photo.close();
            setPhoto(null);
          }}
        />
      )}
      {err && (
        <p role="alert" className="mt-3 text-sm text-warn">
          {err}
        </p>
      )}
    </div>
  );
}
