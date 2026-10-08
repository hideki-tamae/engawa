/** Engawa の印。「縁」の字を、確認済みの印と同じ、朱の丸に。 */
export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full border-2 border-warn/80 bg-paper text-[0.95rem] font-bold leading-none text-warn ${className}`}
    >
      縁
    </span>
  );
}

/** ひとこと。固定の文で、AI が話しているわけではない。 */
export function Guide({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-2xl border-l-4 border-wood/50 bg-paper-2 px-4 py-3 text-[15px] leading-7 text-muted print:hidden">
      {children}
    </p>
  );
}
