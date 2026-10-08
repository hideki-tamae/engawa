/**
 * 縁側のねこ。静かに座って、そばにいるだけの案内役。
 * 人の顔にしない理由：年齢・性別・立場を思わせない／見られている圧を作らない／「相談員」「診断する人」と誤解させない。
 * 目は閉じている（急かさない）。動きは尾が、ゆっくり揺れるだけ（「動きを減らす」設定では止まる）。
 */
const FUR = "#e9b074";
const FUR_DARK = "#cf8e50";
const BELLY = "#fff3df";
const INK = "#5b3a1e";

/** 絵の中身だけ（別の絵に重ねるとき用。座標は 130×112）。 */
export function CatArt() {
  return (
    <>
      {/* しっぽ */}
      <g className="cat-tail" style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}>
        <path d="M88 98 q34 2 30 -30 q-3 -14 -14 -10" fill="none" stroke={FUR_DARK} strokeWidth="11" strokeLinecap="round" />
      </g>
      {/* からだ */}
      <ellipse cx="62" cy="82" rx="31" ry="28" fill={FUR} />
      <ellipse cx="62" cy="90" rx="18" ry="19" fill={BELLY} />
      {/* 前足 */}
      <ellipse cx="52" cy="105" rx="8.5" ry="5.5" fill={BELLY} stroke={FUR_DARK} strokeWidth="1.5" />
      <ellipse cx="72" cy="105" rx="8.5" ry="5.5" fill={BELLY} stroke={FUR_DARK} strokeWidth="1.5" />
      {/* あたま */}
      <path d="M38 34 L42 10 L58 26 Z" fill={FUR} />
      <path d="M86 34 L82 10 L66 26 Z" fill={FUR} />
      <path d="M44 28 L45.5 17 L53 25 Z" fill="#f4b6a0" />
      <path d="M80 28 L78.5 17 L71 25 Z" fill="#f4b6a0" />
      <circle cx="62" cy="46" r="26" fill={FUR} />
      <path d="M52 24 v8 M62 22 v9 M72 24 v8" stroke={FUR_DARK} strokeWidth="2.6" strokeLinecap="round" />
      {/* おだやかな目・鼻・口 */}
      <path d="M48 47 q5.5 5.5 11 0 M65 47 q5.5 5.5 11 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M59 54.5 h6 l-3 3.4 z" fill="#e88c86" />
      <path d="M62 58 q-3.5 3.5 -7 1 M62 58 q3.5 3.5 7 1" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M40 52 l-11 -2 M40 56 l-11 3 M84 52 l11 -2 M84 56 l11 3" stroke={INK} strokeOpacity=".45" strokeWidth="1.3" strokeLinecap="round" />
    </>
  );
}

export function Cat({ className = "", label = "" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 130 112" className={className} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <CatArt />
    </svg>
  );
}

/** 案内役。ひとことを添える（固定の文。AI が話しているわけではない）。 */
export function Guide({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end gap-3 print:hidden">
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-paper-2">
        <Cat className="mt-1 h-12 w-12" />
      </span>
      <p className="relative rounded-2xl rounded-bl-md bg-paper-2 px-4 py-2.5 text-[15px] leading-7 text-muted">{children}</p>
    </div>
  );
}
