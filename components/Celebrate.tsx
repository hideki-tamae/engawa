/**
 * 手帳ができたときの、ささやかなお祝いの絵。縁側に、湯のみと、朱印のついた手帳。
 * にぎやかにしない（困りごとを書いた直後なので）。動きは、控えめ。動きを減らす設定のときは、止まる。
 */
export default function Celebrate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 150" role="img" aria-label="縁側に、湯のみと、朱印のついた手帳" className={`mx-auto h-auto w-full max-w-xs ${className}`}>
      {/* 空と庭 */}
      <circle cx="262" cy="34" r="16" fill="#f2b84b" opacity="0.85" />
      <path d="M0 96 C60 84 110 100 170 92 C230 84 280 98 320 90 V110 H0 Z" fill="#cfe0c4" />
      {/* 縁側の床 */}
      <rect x="0" y="108" width="320" height="42" fill="#d9bf92" />
      <rect x="0" y="108" width="320" height="6" fill="#b89462" />
      <path d="M0 126 H320 M0 140 H320" stroke="#c9a874" strokeWidth="1.5" />
      {/* 座布団 */}
      <ellipse cx="86" cy="112" rx="40" ry="9" fill="#a8362f" />
      <ellipse cx="86" cy="108" rx="40" ry="9" fill="#c0463c" />
      {/* 湯のみ */}
      <path d="M200 104 h30 l-3 22 a10 6 0 0 1 -24 0 z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M205 112 h20" stroke="#7a5a2f" strokeWidth="2" opacity="0.5" />
      <g stroke="#9c8a6a" strokeWidth="2" strokeLinecap="round" fill="none">
        <path className="anim-steam" d="M208 96 c-4 -6 4 -9 0 -15" />
        <path className="anim-steam" style={{ animationDelay: "0.9s" }} d="M218 96 c-4 -6 4 -9 0 -15" />
        <path className="anim-steam" style={{ animationDelay: "1.8s" }} d="M227 96 c-4 -6 4 -9 0 -15" />
      </g>
      {/* 手帳 */}
      <g transform="rotate(-4 140 92)">
        <rect x="104" y="56" width="74" height="54" rx="6" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <rect x="104" y="56" width="12" height="54" rx="4" fill="#7a5a2f" />
        <rect x="124" y="68" width="42" height="5" rx="2.5" fill="#d9c9a8" />
        <rect x="124" y="80" width="42" height="5" rx="2.5" fill="#d9c9a8" />
        <rect x="124" y="92" width="26" height="5" rx="2.5" fill="#d9c9a8" />
      </g>
      {/* 朱印 */}
      <g className="anim-seal">
        <circle cx="168" cy="96" r="14" fill="#fffdf8" stroke="#a8362f" strokeWidth="3" />
        <text x="168" y="102" textAnchor="middle" fontSize="16" fontWeight="700" fill="#a8362f">
          縁
        </text>
      </g>
      {/* きらめき */}
      <g fill="#f2b84b">
        <path className="anim-twinkle" style={{ transformOrigin: "120px 36px", transformBox: "fill-box" }} d="M120 28 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" />
        <path className="anim-twinkle" style={{ animationDelay: "0.8s", transformBox: "fill-box", transformOrigin: "center" }} d="M196 44 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" />
        <path className="anim-twinkle" style={{ animationDelay: "1.5s", transformBox: "fill-box", transformOrigin: "center" }} d="M60 52 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" />
      </g>
    </svg>
  );
}
