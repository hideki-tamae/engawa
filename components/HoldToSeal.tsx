"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "@/components/icons";

const HOLD_MS = 900;

/**
 * 長押しで、確認の印を押す。押している間、色が満ちていく。満ちたら、印が押される（スマホは、軽く振動）。
 * 長押しが難しい人のために、同じ意味のボタン（押すだけ）を、必ず、別に置く。
 */
export default function HoldToSeal({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    start.current = null;
    if (!done.current) setProgress(0);
  };
  useEffect(() => () => stop(), []);

  const tick = (t: number) => {
    if (start.current === null) return;
    const p = Math.min(1, (t - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      try {
        navigator.vibrate?.(30);
      } catch {
        /* 振動できない端末では、何もしない */
      }
      raf.current = null;
      start.current = null;
      onConfirm();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (disabled || done.current) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="長押しして、合っていると確認する。長押しが難しいときは、下のボタンで確認できます"
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-20 w-full touch-none select-none overflow-hidden rounded-full border-2 border-warn/70 bg-paper text-xl font-bold text-warn shadow-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-wood disabled:opacity-50"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 bg-warn/20" style={{ width: `${progress * 100}%` }} />
      <span className="relative flex items-center justify-center gap-3">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full border-2 border-warn bg-paper text-lg">
          {progress >= 1 ? <IconCheck className="h-6 w-6" /> : "縁"}
        </span>
        {progress > 0 && progress < 1 ? "そのまま、おさえて…" : "長押しで、印を押す"}
      </span>
    </button>
  );
}
