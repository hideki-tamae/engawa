import type { FieldKey } from "@/lib/card";

const base = "h-6 w-6";
const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** 項目ごとの、小さな絵記号。いつ＝カレンダー、どこ＝場所、どんなこと＝ふきだし、してほしいこと＝日がさ。 */
export function FieldIcon({ field, className = base }: { field: FieldKey; className?: string }) {
  if (field === "when")
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <circle cx="12" cy="14.5" r="1.4" fill="currentColor" />
      </svg>
    );
  if (field === "where")
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    );
  if (field === "what")
    return (
      <svg viewBox="0 0 24 24" className={className} {...common}>
        <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4.5 4v-4H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
        <path d="M8 10h8M8 13h5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M3 13a9 9 0 0 1 18 0z" />
      <path d="M12 13v6a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** iPhone の設定のような、スイッチ。入＝目が開く、切＝目が閉じる。 */
export function EyeSwitch({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="flex shrink-0 flex-col items-center gap-1">
      <span className={`relative inline-block h-8 w-14 rounded-full transition-colors duration-200 ${on ? "bg-wood" : "bg-paper-3"}`}>
        <span
          className={`absolute top-1 grid h-6 w-6 place-items-center rounded-full bg-paper text-wood shadow transition-all duration-200 ${on ? "left-[1.75rem]" : "left-1 text-muted"}`}
        >
          {on ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
              <path d="M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.1 7.9C3.5 9.7 2 12 2 12s3.6 6 10 6a9.7 9.7 0 0 0 3.4-.6" />
            </svg>
          )}
        </span>
      </span>
      <span className={`text-xs font-bold ${on ? "text-wood-dark" : "text-muted"}`}>{on ? "見せる" : "見せない"}</span>
    </span>
  );
}

/** 「3つのうち2つを見せる」を、点で見せる。 */
export function ScopeDots({ shown, total }: { shown: number; total: number }) {
  return (
    <div className="mt-5 flex items-center gap-3" role="status" aria-live="polite">
      <span aria-hidden className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-3 w-7 rounded-full transition-colors ${i < shown ? "bg-wood" : "bg-line"}`} />
        ))}
      </span>
      <span className="text-sm font-semibold text-muted">
        {total}つのうち、{shown}つを見せる
      </span>
    </div>
  );
}
