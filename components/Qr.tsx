"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** QR コード（SVG）。紙に印刷したとき、スマホで読み取ってリンクを開けるようにする。 */
export default function Qr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 1, width: 120 })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <figure className="inline-block text-center">
      <div role="img" aria-label={label} className="h-[120px] w-[120px]" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="mt-1 text-xs">{label}</figcaption>
    </figure>
  );
}
