/**
 * 最初の5秒で「誰の、何の問題か」と「何が変わるか」を伝える絵。
 * 左：窓口が変わるたびに、同じ説明を繰り返す。右：手帳を1回見せて、そのまま相談へ。
 * 絵は装飾ではなく説明そのもの。文章でも同じことを書く（スクリーンリーダー向け）。
 */
export default function Hero() {
  return (
    <figure>
      <svg
        viewBox="0 0 640 290"
        role="img"
        aria-label="左：窓口が変わるたびに、Aさんが同じ説明を3回繰り返し、疲れていく。右：Aさんが手帳を1回見せるだけで、窓口が最初から事情を分かった上で相談が始まる。"
        className="h-auto w-full"
      >
        <rect width="640" height="290" rx="24" fill="#f3ead9" />
        <line x1="320" y1="26" x2="320" y2="266" stroke="#7a5a2f" strokeOpacity=".22" strokeDasharray="3 7" strokeWidth="2" />

        {/* 左：いま */}
        <text x="28" y="40" fontSize="15" fontWeight="700" fill="#8a2f1d">いま</text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${28 + i * 98}, 58)`}>
            <rect width="84" height="64" rx="12" fill="#fff" stroke="#7a5a2f" strokeOpacity=".35" strokeWidth="1.5" />
            <path d="M12 64 v-30 h60 v30" fill="none" />
            <rect x="12" y="14" width="60" height="9" rx="4.5" fill="#d9c9a8" />
            <text x="42" y="44" textAnchor="middle" fontSize="13" fill="#5b4a33" data-en={`Desk ${"ABC"[i]}`}>{`窓口${"ABC"[i]}`}</text>
            <path d="M42 64 v34" stroke="#b0442f" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6" />
            <g transform="translate(0,104)">
              <rect x="-4" y="0" width="92" height="40" rx="20" fill="#fbe9e3" stroke="#b0442f" strokeOpacity=".5" />
              <text x="42" y="25" textAnchor="middle" fontSize="13" fontWeight="600" fill="#8a2f1d" data-en={["Start…", "Again…", "Again…"][i]}>
                {["最初から…", "また一から…", "また…"][i]}
              </text>
            </g>
            <text x="42" y="178" textAnchor="middle" fontSize="12" fill="#8a2f1d" opacity=".8">
              {["1回目", "2回目", "3回目"][i]}
            </text>
          </g>
        ))}
        <text x="28" y="262" fontSize="14" fill="#5b4a33" data-en="Many give up halfway.">うまく言えない人ほど、途中で諦めてしまう。</text>

        {/* 右：Engawa */}
        <text x="352" y="40" fontSize="15" fontWeight="700" fill="#2f6b3a">Engawa</text>
        <g transform="translate(380, 70)">
          <rect width="96" height="124" rx="12" fill="#7a5a2f" />
          <rect x="10" y="12" width="76" height="100" rx="7" fill="#fbf6ec" />
          <text x="48" y="36" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#2d2418">困りごとの</text>
          <text x="48" y="52" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#2d2418">手帳</text>
          <rect x="22" y="62" width="52" height="5" rx="2.5" fill="#d9c9a8" />
          <rect x="22" y="73" width="40" height="5" rx="2.5" fill="#d9c9a8" />
          <circle cx="62" cy="96" r="12" fill="#e6f1e4" stroke="#2f6b3a" strokeWidth="2" transform="rotate(-8 62 96)" />
          <path d="M56 96 l4 4 l8 -9" fill="none" stroke="#2f6b3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <path d="M486 132 h40" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" />
        <path d="M518 121 l13 11 l-13 11" fill="none" stroke="#7a5a2f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(538, 92)">
          <rect width="82" height="82" rx="12" fill="#fff" stroke="#2f6b3a" strokeOpacity=".5" strokeWidth="1.5" />
          <rect x="12" y="12" width="58" height="9" rx="4.5" fill="#cfe3cb" />
          <text x="41" y="44" textAnchor="middle" fontSize="12" fill="#5b4a33" data-en="Desk">窓口</text>
          <rect x="6" y="52" width="70" height="24" rx="12" fill="#e6f1e4" />
          <text x="41" y="68" textAnchor="middle" fontSize="11" fill="#2f6b3a" data-en="Talk as is">そのまま相談へ</text>
        </g>
        <text x="352" y="262" fontSize="14" fill="#5b4a33">自分の言葉のまま、1回見せるだけ。</text>
      </svg>
      <figcaption className="sr-only">窓口が変わるたびの繰り返しと、手帳を1回見せることの対比</figcaption>
    </figure>
  );
}
