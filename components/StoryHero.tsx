/**
 * 最初の5秒で「誰の、何の問題か」と「何が変わるか」を伝える絵。
 * Aさんが、窓口を回るたびに同じ説明を繰り返す（①②③）。手帳を1回見せるだけで済む（④）。
 * 絵（AI生成）は装飾ではなく説明そのもの。文章でも同じことを書く。
 */
const SCENES = [
  { src: "/story/s1.jpg", label: "窓口A", say: "最初から…", alt: "窓口Aで、Aさんが事情を説明している", tone: "text-warn" },
  { src: "/story/s2.jpg", label: "窓口B", say: "また一から…", alt: "窓口Bで、Aさんが同じ説明を繰り返している。職員は画面を見ている", tone: "text-warn" },
  { src: "/story/s3.jpg", label: "窓口C", say: "また…", alt: "窓口Cで、Aさんは書類を抱えて疲れ切っている", tone: "text-warn" },
  { src: "/story/s4.jpg", label: "手帳", say: "1回見せるだけ", alt: "Aさんが手帳を1回見せると、職員が読んでうなずいている", tone: "text-ok" },
];

export default function StoryHero() {
  return (
    <figure>
      <ul className="grid grid-cols-2 gap-2.5" aria-label="窓口が変わるたびに同じ説明を繰り返す様子（左上から順に）と、手帳を1回見せるだけで済む様子">
        {SCENES.map((s, i) => (
          <li key={s.src} className="anim-fade-up" style={{ animationDelay: `${0.15 + i * 0.7}s` }}>
            <img src={s.src} alt={s.alt} width={800} height={600} loading={i === 0 ? "eager" : "lazy"} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft" />
            <p className={`mt-1.5 text-[0.85rem] font-bold leading-6 [word-break:auto-phrase] ${s.tone}`}>
              <span aria-hidden>{["①", "②", "③", "④"][i]} </span>
              {s.label}：{s.say}
            </p>
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 text-xs text-muted">イメージ（AI生成）。登場人物は架空です。</figcaption>
    </figure>
  );
}
