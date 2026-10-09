/** プライバシーの絵。手帳を、鍵つきの盾が、守っているところ。茶色の背景の上で使う。 */
export default function PrivacyHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 96" aria-hidden className={`h-auto w-44 ${className}`}>
      {/* 手帳 */}
      <g transform="rotate(-6 70 52)">
        <rect x="30" y="24" width="82" height="58" rx="7" fill="#fffdf8" stroke="#fffdf8" />
        <rect x="30" y="24" width="12" height="58" rx="5" fill="#d9bf92" />
        <g stroke="#d9c9a8" strokeWidth="4.5" strokeLinecap="round">
          <path d="M52 40 H98" />
          <path d="M52 52 H92" />
          <path d="M52 64 H80" />
        </g>
      </g>
      {/* 盾 */}
      <path d="M128 20 q0 -2 2 -2.6 l30 -9 l30 9 q2 .6 2 2.6 v26 q0 24 -32 38 q-32 -14 -32 -38 z" fill="#e6f1e4" stroke="#fffdf8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M130 22 l30 -9 l30 9 v24 q0 21 -30 34 q-30 -13 -30 -34 z" fill="#2f6b3a" opacity="0.18" />
      {/* 鍵 */}
      <rect x="146" y="40" width="28" height="22" rx="5" fill="#7a5a2f" />
      <path d="M152 40 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="#7a5a2f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="51" r="3" fill="#fffdf8" />
      <path d="M160 53 v5" stroke="#fffdf8" strokeWidth="2.6" strokeLinecap="round" />
      <g fill="#f2b84b">
        <path className="anim-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }} d="M16 22 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" />
        <path className="anim-twinkle" style={{ animationDelay: "1s", transformBox: "fill-box", transformOrigin: "center" }} d="M206 60 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" />
      </g>
    </svg>
  );
}
