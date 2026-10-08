/**
 * 最初の5秒で「誰の、何の問題か」と「何が変わるか」を伝える絵。
 * 左：窓口が変わるたびに、同じ説明を繰り返す。右：手帳を1回見せる。
 * 絵は装飾ではなく、説明そのもの（スクリーンリーダー向けに、文章でも書く）。
 */
export default function Hero() {
  return (
    <figure className="mt-6">
      <svg
        viewBox="0 0 640 250"
        role="img"
        aria-label="左：窓口が変わるたびに、Aさんが同じ説明を3回繰り返す。右：Aさんが手帳を1回見せるだけで、相談が始まる。"
        className="h-auto w-full"
      >
        <rect x="0" y="0" width="640" height="250" rx="20" fill="#f3ead9" />
        <text x="24" y="34" fontSize="15" fontWeight="700" fill="#7a5a2f">いま</text>
        <text x="352" y="34" fontSize="15" fontWeight="700" fill="#7a5a2f">Engawa</text>
        <line x1="332" y1="20" x2="332" y2="232" stroke="#7a5a2f" strokeOpacity=".25" strokeDasharray="4 6" />

        {/* 左：3つの窓口と、繰り返し */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${24 + i * 100}, 56)`}>
            <rect width="84" height="64" rx="10" fill="#fff" stroke="#7a5a2f" strokeOpacity=".4" />
            <text x="42" y="26" textAnchor="middle" fontSize="13" fill="#2d2418">窓口{"ABC"[i]}</text>
            <text x="42" y="48" textAnchor="middle" fontSize="11" fill="#7a5a2f">{["1回目", "2回目", "3回目"][i]}</text>
            <path d={`M20 74 q0 22 22 22 h22`} fill="none" stroke="#b0442f" strokeWidth="2" strokeLinecap="round" />
            <rect y="100" width="84" height="38" rx="9" fill="#fbe9e3" stroke="#b0442f" strokeOpacity=".5" />
            <text x="42" y="124" textAnchor="middle" fontSize="12" fill="#8a2f1d">また一から…</text>
          </g>
        ))}
        <text x="24" y="224" fontSize="13" fill="#5b4a33">うまく言えない人ほど、途中で諦める。</text>

        {/* 右：手帳を1回見せる */}
        <g transform="translate(372, 52)">
          <rect width="92" height="118" rx="10" fill="#7a5a2f" />
          <rect x="10" y="12" width="72" height="94" rx="6" fill="#fbf6ec" />
          <text x="46" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2d2418">困りごと</text>
          <text x="46" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2d2418">手帳</text>
          <circle cx="46" cy="82" r="14" fill="none" stroke="#2f6b3a" strokeWidth="2" />
          <path d="M39 82 l5 5 l10 -11" fill="none" stroke="#2f6b3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <path d="M476 110 h46" stroke="#7a5a2f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M514 100 l12 10 l-12 10" fill="none" stroke="#7a5a2f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(536, 70)">
          <rect width="84" height="64" rx="10" fill="#fff" stroke="#7a5a2f" strokeOpacity=".4" />
          <text x="42" y="26" textAnchor="middle" fontSize="13" fill="#2d2418">窓口</text>
          <text x="42" y="48" textAnchor="middle" fontSize="11" fill="#2f6b3a">そのまま相談へ</text>
        </g>
        <text x="372" y="224" fontSize="13" fill="#5b4a33">自分の言葉のまま、1回見せるだけ。</text>
      </svg>
      <figcaption className="sr-only">窓口が変わるたびの繰り返しと、手帳を1回見せることの対比</figcaption>
    </figure>
  );
}
