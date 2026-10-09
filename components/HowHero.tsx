/** 「仕組みを見る」の絵。手帳の中身を、虫めがねで、のぞいて確かめるところ。 */
export default function HowHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 150" role="img" aria-label="虫めがねで、仕組みを確かめるイメージ" className={`mx-auto h-auto w-full max-w-sm ${className}`}>
      <circle cx="312" cy="30" r="16" fill="#f2b84b" opacity="0.85" />
      <rect x="0" y="116" width="360" height="34" fill="#d9bf92" />
      <rect x="0" y="116" width="360" height="5" fill="#b89462" />
      {/* 手帳 */}
      <g transform="rotate(-3 130 80)">
        <rect x="70" y="40" width="120" height="76" rx="8" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3.5" />
        <rect x="70" y="40" width="14" height="76" rx="5" fill="#7a5a2f" />
        {/* チェックの行 */}
        <g fill="none" stroke="#2f6b3a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M96 58 l5 5 9 -10" />
          <path d="M96 76 l5 5 9 -10" />
          <path d="M96 94 l5 5 9 -10" />
        </g>
        <g stroke="#d9c9a8" strokeWidth="4.5" strokeLinecap="round">
          <path d="M122 58 H174" />
          <path d="M122 76 H168" />
          <path d="M122 94 H158" />
        </g>
      </g>
      {/* 虫めがね */}
      <g className="anim-float">
        <circle cx="228" cy="70" r="30" fill="#bfe0ee" fillOpacity="0.55" stroke="#7a5a2f" strokeWidth="5" />
        <path d="M250 92 L282 124" stroke="#7a5a2f" strokeWidth="9" strokeLinecap="round" />
        <path d="M212 60 q8 -10 20 -10" stroke="#fffdf8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
      </g>
      {/* 盾（守っている印） */}
      <path d="M44 96 q0 -22 22 -26 q22 4 22 26 q0 14 -22 24 q-22 -10 -22 -24 z" fill="#e6f1e4" stroke="#2f6b3a" strokeWidth="3" transform="translate(-20 -14) scale(0.9)" />
      <path d="M36 82 l7 7 12 -13" fill="none" stroke="#2f6b3a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#f2b84b">
        <path className="anim-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }} d="M300 70 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" />
        <path className="anim-twinkle" style={{ animationDelay: "1s", transformBox: "fill-box", transformOrigin: "center" }} d="M40 36 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" />
      </g>
    </svg>
  );
}
