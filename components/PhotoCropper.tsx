"use client";

import { useEffect, useRef, useState } from "react";
import { COVER_ASPECT, cropRect } from "@/lib/cover";
import { cropToCover, saveCover } from "@/lib/cover-client";
import { Button } from "@/components/ui";

/** 写真を、手帳のカバーの形に合わせる。見える範囲を見ながら、位置と大きさを選ぶ。 */
export default function PhotoCropper({ bmp, onDone }: { bmp: ImageBitmap; onDone: () => void }) {
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const r = cropRect(bmp.width, bmp.height, x, y, zoom);
    c.getContext("2d")?.drawImage(bmp, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
  }, [bmp, x, y, zoom]);

  const slider = "mt-1 w-full accent-[var(--color-wood)]";
  return (
    <div className="mt-4 rounded-2xl border-2 border-wood bg-paper-2 p-4">
      <p className="text-base font-bold">見える範囲を、合わせます</p>
      <canvas
        ref={canvas}
        width={540}
        height={540 / COVER_ASPECT}
        className="mt-3 h-auto w-full rounded-xl border border-line"
        role="img"
        aria-label="カバーに使われる範囲のプレビュー"
      />
      <div className="mt-3 space-y-3">
        <label className="block text-sm font-semibold">
          左右
          <input type="range" min={0} max={1} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} className={slider} />
        </label>
        <label className="block text-sm font-semibold">
          上下
          <input type="range" min={0} max={1} step={0.01} value={y} onChange={(e) => setY(Number(e.target.value))} className={slider} />
        </label>
        <label className="block text-sm font-semibold">
          大きさ
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className={slider} />
        </label>
      </div>
      {err && (
        <p role="alert" className="mt-3 text-sm text-warn">
          {err}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <Button
          className="flex-1"
          onClick={() => {
            try {
              saveCover(cropToCover(bmp, x, y, zoom));
              onDone();
            } catch {
              setErr("この写真は、使えませんでした。別の写真を、お試しください。");
            }
          }}
        >
          この範囲にする
        </Button>
        <Button variant="ghost" onClick={onDone}>
          やめる
        </Button>
      </div>
    </div>
  );
}
