/**
 * 縁側の風景。午後の光、木の床、湯のみと手帳。
 * 家の「内」と「外」のあいだで、人が腰かけて話せる場所、という名前の由来を、そのまま絵にした。
 */
import { CatArt } from "./Cat";

export default function Veranda({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label="縁側の絵。午後の光が差す木の床に、湯のみと手帳が置かれている。" className={className}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf3da" />
          <stop offset="1" stopColor="#f8e3b6" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99a5b" />
          <stop offset="1" stopColor="#a87a3f" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd77a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="240" rx="24" fill="url(#sky)" />
      <g className="anim-sun">
        <circle cx="500" cy="82" r="86" fill="url(#glow)" />
        <circle cx="500" cy="82" r="30" fill="#f2b84b" />
      </g>
      {/* 庭の緑 */}
      <path d="M0 150 q60 -34 130 -10 t140 -4 t150 -14 t140 0 t80 -6 V170 H0z" fill="#b8c99a" />
      <path d="M0 162 q80 -26 170 -6 t170 -2 t170 -10 t130 4 V176 H0z" fill="#9db77d" />
      {/* 軒 */}
      <path d="M0 0 H640 V24 Q320 46 0 24z" fill="#7a5a2f" />
      <path d="M0 24 Q320 46 640 24 V32 Q320 54 0 32z" fill="#5b4222" opacity="0.55" />
      {/* 縁側の床 */}
      <rect y="172" width="640" height="68" fill="url(#floor)" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2="640" y1={186 + i * 15} y2={186 + i * 15} stroke="#8d6531" strokeOpacity="0.55" strokeWidth="1.5" />
      ))}
      <path d="M0 172 H640" stroke="#e1b878" strokeWidth="3" />
      {/* 座布団とねこ */}
      <ellipse cx="170" cy="210" rx="56" ry="12" fill="#b0442f" opacity="0.9" />
      <ellipse cx="170" cy="206" rx="56" ry="12" fill="#c9553d" />
      <g transform="translate(106,112) scale(0.98)">
        <CatArt />
      </g>
      {/* 湯のみと湯気 */}
      <g transform="translate(262,176)">
        <path d="M0 8 h40 l-4 26 q-16 8 -32 0z" fill="#f4efe6" stroke="#7a5a2f" strokeWidth="2" />
        <path d="M6 14 h28" stroke="#9cb4a0" strokeWidth="3" strokeLinecap="round" />
        <g className="anim-float" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round">
          <path d="M14 0 q-6 -10 0 -18 t0 -16" />
          <path d="M26 2 q6 -10 0 -18 t0 -14" />
        </g>
      </g>
      {/* 手帳 */}
      <g transform="translate(360,170) rotate(-5)">
        <rect width="62" height="40" rx="5" fill="#7a5a2f" />
        <rect x="5" y="5" width="52" height="30" rx="3" fill="#fbf6ec" />
        <text x="31" y="19" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#2d2418">困りごとの</text>
        <text x="31" y="29" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#2d2418">手帳</text>
      </g>
    </svg>
  );
}
