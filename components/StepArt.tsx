/**
 * 各ステップの、小さな絵。書く・質問・確認・見せ方。
 * 小さく、静かに。画面が低い端末（キーボードが出ているとき）は、出さない。
 */
type Step = "write" | "ask" | "confirm" | "scope";

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

function Scene({ step }: { step: Step }) {
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

export default function StepArt({ step }: { step: Step }) {
  return (
    <svg
      viewBox="0 0 300 90"
      aria-hidden
      className="mx-auto mb-4 h-auto max-h-24 w-full max-w-[17rem] print:hidden [@media(max-height:700px)]:hidden"
    >
      <Scene step={step} />
    </svg>
  );
}
