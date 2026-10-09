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


/**
 * 質問のページの絵。やわらかい色の、角丸のタイルに、白い線の絵記号。
 * 「見せる範囲」の画面と、同じ絵記号（いつ＝カレンダー、どこ＝場所、どんなこと＝ふきだし、してほしいこと＝日がさ）。
 */
const GLYPH: Record<Field, React.ReactNode> = {
  when: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="14.5" r="1.5" fill="#fff" stroke="none" />
    </>
  ),
  where: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  what: (
    <>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4.5 4v-4H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  help: (
    <>
      <path d="M3 12.5a9 9 0 0 1 18 0c-1.5-1.3-3-1.3-4.5 0c-1.5-1.3-3-1.3-4.5 0c-1.5-1.3-3-1.3-4.5 0c-1.5-1.3-3-1.3-4.5 0z" />
      <path d="M12 12.5V18a2 2 0 0 1-4 0M12 3.5V2" />
    </>
  ),
};

const TILE_COLORS: Record<Field, [string, string]> = {
  when: ["#b58a4a", "#7a5a2f"],
  where: ["#7ea36a", "#4f7a3c"],
  what: ["#d79a6a", "#a8643a"],
  help: ["#7fa6c4", "#4a7396"],
};

function TileScene({ kind }: { kind: Field }) {
  const [c1, c2] = TILE_COLORS[kind];
  const id = `tile-${kind}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={c1} stopOpacity="0.28" />
          <stop offset="1" stopColor={c1} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="46" rx="92" ry="40" fill={`url(#${id}-glow)`} />
      {/* ひかえめな、まわりの丸 */}
      <circle cx="62" cy="30" r="9" fill={c1} opacity="0.22" />
      <circle cx="94" cy="64" r="4.5" fill={c2} opacity="0.2" />
      <circle cx="238" cy="26" r="6" fill={c1} opacity="0.26" />
      <circle cx="212" cy="66" r="10" fill={c2} opacity="0.16" />
      <circle cx="262" cy="56" r="3.5" fill={c1} opacity="0.3" />
      {kind === "help" && (
        <g stroke="#9bb7c6" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
          <path d="M98 14 l-3 8 M110 8 l-3 8 M190 8 l-3 8 M202 16 l-3 8" />
        </g>
      )}
      <g className="anim-float">
        <rect x="116" y="14" width="68" height="68" rx="19" fill="#2d2418" opacity="0.1" transform="translate(0 4)" />
        <rect x="114" y="10" width="72" height="72" rx="20" fill={`url(#${id})`} />
        <rect x="114.75" y="10.75" width="70.5" height="70.5" rx="19.3" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="1.5" />
        <g transform="translate(130 26) scale(1.7)" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {GLYPH[kind]}
        </g>
      </g>
    </>
  );
}

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
  if (step === "ask") return <TileScene kind={field ?? "what"} />;
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
