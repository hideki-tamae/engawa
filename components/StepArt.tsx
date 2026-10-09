/**
 * 各ステップの、小さな絵。書く・質問・確認・見せ方。
 * 小さく、静かに。画面が低い端末（キーボードが出ているとき）は、出さない。
 */
type Step = "write" | "ask" | "confirm" | "scope";
type Field = "when" | "where" | "what" | "help";

const GROUND = (
  <>
    <rect x="0" y="66" width="300" height="24" fill="#d9bf92" />
    <rect x="0" y="66" width="300" height="4" fill="#b89462" />
  </>
);
const SUN = <circle cx="258" cy="22" r="11" fill="#f2b84b" opacity="0.85" />;
const SPARK = (x: number, y: number, d: string) => (
  <path className="anim-twinkle" style={{ animationDelay: d, transformBox: "fill-box", transformOrigin: "center" }} fill="#f2b84b" d={`M${x} ${y} l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z`} />
);

function Scene({ step, field }: { step: Step; field?: Field }) {
  if (step === "write")
    return (
      <>
        {SUN}
        {GROUND}
        {/* 開いた手帳 */}
        <g transform="rotate(-3 150 52)">
          <path d="M96 66 V30 Q122 24 150 32 Q178 24 204 30 V66 Z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M150 32 V66" stroke="#7a5a2f" strokeWidth="2.5" />
          <path d="M108 42 H138 M108 50 H138 M162 42 H192 M162 50 H184" stroke="#d9c9a8" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        {/* えんぴつ */}
        <g transform="rotate(32 206 38)">
          <rect x="192" y="34" width="46" height="8" rx="2" fill="#f2b84b" stroke="#7a5a2f" strokeWidth="2" />
          <path d="M192 34 L180 38 L192 42 Z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="2" strokeLinejoin="round" />
        </g>
        {SPARK(70, 24, "0s")}
      </>
    );
  if (step === "ask" && field === "when")
    return (
      <>
        {SUN}
        {GROUND}
        {/* 壁かけカレンダー */}
        <rect x="96" y="10" width="64" height="56" rx="6" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <rect x="96" y="10" width="64" height="14" rx="6" fill="#a8362f" />
        <g fill="#d9c9a8">
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={108 + c * 14} cy={34 + r * 8} r="2.4" />))}
        </g>
        <circle cx="122" cy="42" r="6.5" fill="none" stroke="#a8362f" strokeWidth="2.6" />
        {/* とけい */}
        <circle cx="206" cy="38" r="22" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <path d="M206 38 V24 M206 38 L216 44" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" />
        {SPARK(70, 24, "0s")}
      </>
    );
  if (step === "ask" && field === "where")
    return (
      <>
        {SUN}
        {GROUND}
        {/* 家 */}
        <rect x="62" y="38" width="44" height="28" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <path d="M56 40 L84 18 L112 40 Z" fill="#a8362f" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
        <rect x="78" y="48" width="12" height="18" fill="#7a5a2f" />
        {/* 学校 */}
        <rect x="124" y="30" width="52" height="36" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <path d="M150 30 V14 M150 14 h12 v7 h-12" stroke="#2f6b3a" strokeWidth="3" fill="#2f6b3a" strokeLinejoin="round" />
        <g fill="#bfe0ee" stroke="#7a5a2f" strokeWidth="2">
          <rect x="132" y="40" width="10" height="9" />
          <rect x="158" y="40" width="10" height="9" />
        </g>
        {/* 役所・ビル */}
        <rect x="190" y="24" width="40" height="42" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
        <g fill="#d9c9a8">
          <rect x="198" y="32" width="8" height="6" />
          <rect x="214" y="32" width="8" height="6" />
          <rect x="198" y="46" width="8" height="6" />
          <rect x="214" y="46" width="8" height="6" />
        </g>
        {SPARK(246, 40, "0.7s")}
      </>
    );
  if (step === "ask" && field === "what")
    return (
      <>
        {SUN}
        {GROUND}
        {/* お金・住まい・心 */}
        <circle cx="106" cy="48" r="17" fill="#f2b84b" stroke="#7a5a2f" strokeWidth="3" />
        <text x="106" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#7a5a2f">
          ¥
        </text>
        <path d="M150 52 V36 L166 24 L182 36 V52 Z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
        <path d="M224 56 C196 40 206 22 224 34 C242 22 252 40 224 56 Z" fill="#e8908a" stroke="#a8362f" strokeWidth="3" strokeLinejoin="round" />
        {SPARK(70, 26, "0s")}
      </>
    );
  if (step === "ask" && field === "help")
    return (
      <>
        {GROUND}
        {/* 雨と、日がさ */}
        <g stroke="#9bb7c6" strokeWidth="2.4" strokeLinecap="round">
          <path d="M86 8 l-4 10 M112 4 l-4 10 M200 8 l-4 10 M232 6 l-4 10" />
        </g>
        <path d="M110 40 Q150 -2 190 40 Z" fill="#a8362f" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
        <path d="M150 40 V62 q0 6 -7 6" fill="none" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" />
        <path d="M150 54 C140 47 144 41 150 46 C156 41 160 47 150 54 Z" fill="#fffdf8" stroke="#a8362f" strokeWidth="2" />
        {SPARK(220, 30, "0.5s")}
      </>
    );
  if (step === "ask")
    return (
      <>
        {SUN}
        {GROUND}
        {/* 湯のみ */}
        <path d="M120 52 h34 l-3 18 a11 6 0 0 1 -28 0 z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="2.5" strokeLinejoin="round" />
        <g stroke="#9c8a6a" strokeWidth="2" strokeLinecap="round" fill="none">
          <path className="anim-steam" d="M130 44 c-4 -6 4 -9 0 -15" />
          <path className="anim-steam" style={{ animationDelay: "1s" }} d="M142 44 c-4 -6 4 -9 0 -15" />
        </g>
        {/* ふきだし（点3つ） */}
        <g>
          <rect x="176" y="14" width="64" height="32" rx="14" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="2.5" />
          <path d="M184 46 l-8 10 l16 -6 z" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="194" cy="30" r="3.4" fill="#7a5a2f" />
          <circle cx="208" cy="30" r="3.4" fill="#7a5a2f" />
          <circle cx="222" cy="30" r="3.4" fill="#7a5a2f" />
        </g>
        {SPARK(84, 26, "0.6s")}
      </>
    );
  if (step === "confirm")
    return (
      <>
        {SUN}
        {GROUND}
        <g transform="rotate(-4 150 50)">
          <rect x="108" y="30" width="84" height="38" rx="6" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
          <rect x="108" y="30" width="11" height="38" rx="4" fill="#7a5a2f" />
          <path d="M128 42 H176 M128 52 H168" stroke="#d9c9a8" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        {/* 朱印 */}
        <g className="anim-seal">
          <circle cx="176" cy="46" r="14" fill="#fffdf8" stroke="#a8362f" strokeWidth="3" />
          <text x="176" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="#a8362f">
            縁
          </text>
        </g>
        {SPARK(70, 30, "0s")}
        {SPARK(222, 34, "1.1s")}
      </>
    );
  return (
    <>
      {SUN}
      {GROUND}
      {/* 携帯 */}
      <rect x="70" y="14" width="38" height="58" rx="8" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
      <path d="M80 30 H98 M80 38 H98 M80 46 H90" stroke="#d9c9a8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="96" cy="58" r="6" fill="#fffdf8" stroke="#a8362f" strokeWidth="2.4" />
      <path d="M118 44 H168" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
      <path d="M160 36 L172 44 L160 52" fill="none" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* 窓口 */}
      <rect x="184" y="30" width="66" height="40" fill="#fffdf8" stroke="#7a5a2f" strokeWidth="3" />
      <path d="M178 32 L217 12 L256 32 Z" fill="#a8362f" stroke="#7a5a2f" strokeWidth="3" strokeLinejoin="round" />
      <rect x="194" y="42" width="22" height="16" rx="2" fill="#bfe0ee" stroke="#7a5a2f" strokeWidth="2.2" />
      <rect x="226" y="46" width="16" height="24" rx="2" fill="#7a5a2f" />
      {SPARK(130, 20, "0.4s")}
    </>
  );
}

export default function StepArt({ step, field }: { step: Step; field?: Field }) {
  return (
    <svg
      viewBox="0 0 300 90"
      aria-hidden
      className="mx-auto mb-4 h-auto max-h-24 w-full max-w-[17rem] print:hidden [@media(max-height:700px)]:hidden"
    >
      <Scene step={step} field={field} />
    </svg>
  );
}
