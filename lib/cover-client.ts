"use client";

import { useSyncExternalStore } from "react";
import { COVER_H, COVER_W, type Cover, MAX_PHOTO_CHARS, cropRect, parseCover } from "./cover";

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

/** 写真を読み込む（切り出しの画面で使う）。送信はしない。 */
export async function loadPhoto(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) throw new Error("not_image");
  if (file.size > 12 * 1024 * 1024) throw new Error("too_big");
  return createImageBitmap(file);
}

/** 選んだ位置・大きさで、カバーの形に切り出して、端末の中に保存できる形（JPEG）にする。 */
export function cropToCover(bmp: ImageBitmap, x: number, y: number, zoom: number): Cover {
  const r = cropRect(bmp.width, bmp.height, x, y, zoom);
  const canvas = document.createElement("canvas");
  canvas.width = COVER_W;
  canvas.height = COVER_H;
  canvas.getContext("2d")!.drawImage(bmp, r.sx, r.sy, r.sw, r.sh, 0, 0, COVER_W, COVER_H);
  for (const q of [0.82, 0.68, 0.5]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= MAX_PHOTO_CHARS) return { kind: "photo", dataUrl };
  }
  throw new Error("too_big");
}
