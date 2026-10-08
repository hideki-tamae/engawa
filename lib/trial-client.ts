"use client";

import { useSyncExternalStore } from "react";
import type { TrialEvent } from "./trial";

/**
 * 試用の記録（ブラウザ側）。?trial=1 のリンクから入った人だけ。
 * 記録するのは、決められた出来事の名前と、経過時間だけ。本人の言葉は、送らない。
 */
const KEY = "engawa_trial";
const EVT = "engawa-trial-change";

interface State {
  sid: string;
  t0: number | null;
}

function read(): State | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}
function write(s: State | null) {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* 保存できない環境では、記録しない */
  }
  window.dispatchEvent(new Event(EVT));
}

export function initTrial() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("trial") === "1" && !read()) write({ sid: crypto.randomUUID(), t0: null });
    if (p.get("trial") === "0") write(null);
  } catch {
    /* 何もしない */
  }
}

export function trialActive(): boolean {
  return read() !== null;
}

export function useTrialMode(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVT, cb);
      return () => window.removeEventListener(EVT, cb);
    },
    () => trialActive(),
    () => false,
  );
}

export function track(event: TrialEvent, extra: { voice?: boolean; skipped?: number; shared?: number } = {}) {
  const s = read();
  if (!s) return;
  if (event === "start") {
    s.t0 = Date.now();
    write(s);
  }
  const t = s.t0 === null ? 0 : Date.now() - s.t0;
  const body = JSON.stringify({ sid: s.sid, event, t, ...extra });
  try {
    void fetch("/api/trial", { method: "POST", body, keepalive: true });
  } catch {
    /* 記録できなくても、操作は止めない */
  }
}
