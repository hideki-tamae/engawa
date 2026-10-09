/** 窓口の方へ、のページの絵。手帳が、ふわっと窓口に届くところ。顔は描かない。 */
export default function WindowsHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 170" role="img" aria-label="手帳が、窓口にふわっと届くイメージ" className={`mx-auto h-auto w-full max-w-sm ${className}`}>
      {/* 空 */}
      <circle cx="304" cy="34" r="18" fill="#f2b84b" opacity="0.85" />
      <g fill="#fffdf8" opacity="0.9">
        <ellipse cx="70" cy="34" rx="26" ry="9" />
        <ellipse cx="88" cy="28" rx="18" ry="8" />
        <ellipse cx="246" cy="52" rx="22" ry="7" />
      </g>
      {/* 地面 */}
      <rect x="0" y="136" width="360" height="34" fill="#cfe0c4" />
      <path d="M150 170 L172 136 H228 L250 170 Z" fill="#e6d3ad" />
      {/* 建物 */}
      <rect x="190" y="70" width="120" height="68" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
      <path d="M180 72 L250 38 L320 72 Z" fill="#a8362f" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
      <rect x="206" y="88" width="34" height="26" rx="3" fill="#bfe0ee" stroke="#7a5a2f" strokeWidth="2.5" />
      <path d="M223 88 V114 M206 101 H240" stroke="#7a5a2f" strokeWidth="2" />
      <rect x="258" y="96" width="32" height="42" rx="3" fill="#7a5a2f" />
      <circle cx="284" cy="118" r="2.2" fill="#f2b84b" />
      {/* のれん */}
      <rect x="198" y="78" width="46" height="8" fill="#2f6b3a" />
      <g fill="#2f6b3a">
        <rect x="200" y="86" width="9" height="10" />
        <rect x="213" y="86" width="9" height="10" />
        <rect x="226" y="86" width="9" height="10" />
      </g>
      {/* 手帳（ふわっと） */}
      <g className="anim-float" transform="rotate(-8 120 92)">
        <rect x="92" y="64" width="62" height="46" rx="6" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <rect x="92" y="64" width="10" height="46" rx="4" fill="#7a5a2f" />
        <rect x="110" y="75" width="34" height="4.5" rx="2.2" fill="#d9c9a8" />
        <rect x="110" y="85" width="34" height="4.5" rx="2.2" fill="#d9c9a8" />
        <rect x="110" y="95" width="20" height="4.5" rx="2.2" fill="#d9c9a8" />
        <circle cx="146" cy="104" r="11" fill="#fffdf8" stroke="#a8362f" strokeWidth="2.6" />
        <text x="146" y="109" textAnchor="middle" fontSize="13" fontWeight="700" fill="#a8362f">
          縁
        </text>
      </g>
      {/* 道すじ */}
      <path d="M160 120 C172 112 178 112 188 106" stroke="#7a5a2f" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 7" fill="none" />
      {/* きらめき */}
      <g fill="#f2b84b">
        <path className="anim-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }} d="M62 78 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" />
        <path className="anim-twinkle" style={{ animationDelay: "0.9s", transformBox: "fill-box", transformOrigin: "center" }} d="M168 54 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" />
        <path className="anim-twinkle" style={{ animationDelay: "1.6s", transformBox: "fill-box", transformOrigin: "center" }} d="M40 118 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" />
      </g>
    </svg>
  );
}
