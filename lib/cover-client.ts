"use client";

import { useSyncExternalStore } from "react";
import { type Cover, MAX_PHOTO_CHARS, parseCover } from "./cover";

const KEY = "engawa_cover";
const EVT = "engawa-cover-change";

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useCover(): Cover | null {
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
  return parseCover(raw);
}

export function saveCover(c: Cover | null) {
  try {
    if (c) localStorage.setItem(KEY, JSON.stringify(c));
    else localStorage.removeItem(KEY);
  } catch {
    /* 保存できない環境では、何もしない */
  }
  window.dispatchEvent(new Event(EVT));
}

/** 写真を、幅800pxに縮めて、端末の中に保存できる形（JPEG）にする。送信はしない。 */
export async function photoToCover(file: File): Promise<Cover> {
  if (!file.type.startsWith("image/")) throw new Error("not_image");
  if (file.size > 12 * 1024 * 1024) throw new Error("too_big");
  const bmp = await createImageBitmap(file);
  const w = Math.min(800, bmp.width);
  const h = Math.round((bmp.height * w) / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  for (const q of [0.8, 0.65, 0.5]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= MAX_PHOTO_CHARS) return { kind: "photo", dataUrl };
  }
  throw new Error("too_big");
}
