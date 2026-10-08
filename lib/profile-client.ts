"use client";

import { useSyncExternalStore } from "react";
import { type Profile, parseProfile, validateProfile } from "./profile";

const KEY = "engawa_profile";
const EVT = "engawa-profile-change";

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** この端末に残した基本情報。サーバーには、送らない。 */
export function useProfile(): Profile | null {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    readRaw,
    () => null,
  );
  return parseProfile(raw);
}

export function saveProfile(p: unknown): { ok: true } | { ok: false; reason: "invalid" | "id_number" } {
  const r = validateProfile(p);
  if (!r.ok) return r;
  try {
    if (Object.keys(r.value).length) localStorage.setItem(KEY, JSON.stringify(r.value));
    else localStorage.removeItem(KEY);
  } catch {
    /* 保存できない環境では、何もしない */
  }
  window.dispatchEvent(new Event(EVT));
  return { ok: true };
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 何もしない */
  }
  window.dispatchEvent(new Event(EVT));
}
