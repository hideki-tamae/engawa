/** 窓口側の画面の、さりげない印。線だけで、静かに。動きは、つけない。 */
export default function WindowMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 17 20 7l15 10" />
      <path d="M8 17v16h24V17" />
      <rect x="13" y="21" width="8" height="7" rx="1" />
      <path d="M25 33v-8h4v8" />
      <circle cx="30" cy="12" r="3.2" className="fill-warn/0" stroke="#a8362f" />
    </svg>
  );
}
