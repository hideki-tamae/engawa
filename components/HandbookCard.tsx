import type { FieldKey } from "@/lib/card";
import { IconCheck } from "./icons";

const LABEL: Record<FieldKey, string> = {
  what: "どんなこと",
  when: "いつ頃",
  where: "どこで",
  help: "してほしいこと",
};
const ORDER: FieldKey[] = ["what", "help", "when", "where"];

/** 確認済みの印（ハンコ）。本人が「合っている」と確かめた証。本文に重ならないよう、下の帯に押す。 */
function Seal({ date, animate }: { date?: string; animate?: boolean }) {
  return (
    <div
      className={`grid h-16 w-16 shrink-0 rotate-[-6deg] place-items-center rounded-full border-[3px] border-warn/80 bg-paper/70 text-center text-warn ${
        animate ? "anim-stamp" : ""
      }`}
      aria-label={`確認済み${date ? `（${date}）` : ""}`}
    >
      <div className="leading-tight">
        <p className="text-[13px] font-bold tracking-widest">確認済</p>
        {date && <p className="text-[10px] tracking-wide">{date}</p>}
      </div>
    </div>
  );
}

/**
 * 「困りごとの手帳」そのもの。画面でも、窓口に見せるときも、同じ見た目。
 * 本人の言葉を中心に、本人が選んだ項目だけを並べる。診断や評価の欄はない。
 */
export default function HandbookCard({
  statement,
  fields,
  stamp = true,
  stampDate,
  animateIn = false,
  animateStamp = false,
  large = false,
  draft = false,
}: {
  statement: string;
  fields: Partial<Record<FieldKey, { value: string }>>;
  stamp?: boolean;
  stampDate?: string;
  animateIn?: boolean;
  animateStamp?: boolean;
  large?: boolean;
  draft?: boolean;
}) {
  const body = large ? "text-3xl leading-[1.65]" : "text-xl leading-9";
  const small = large ? "text-lg" : "text-sm";
  const present = ORDER.filter((k) => fields[k]);
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-paper shadow-lift ${
        draft ? "border-dashed border-wood/60" : "border-wood/40"
      } ${animateIn ? "anim-card-in" : ""}`}
    >
      <header className="flex items-center justify-between bg-wood px-5 py-3.5 text-paper">
        <span className="flex items-center gap-2 text-base font-bold tracking-wide">
          <span aria-hidden className="inline-block h-4 w-1.5 rounded-full bg-sun" />
          困りごとの手帳
        </span>
        <span className="rounded-full border border-paper/50 px-3 py-0.5 text-xs tracking-wider">
          {draft ? "確認前" : "Engawa"}
        </span>
      </header>
      <div className="space-y-5 px-6 py-6">
        <section>
          <p className={`${small} font-medium text-muted`}>本人の言葉</p>
          <p className={`mt-1.5 ${body} text-ink`}>{statement}</p>
        </section>
        {present.map((k) => (
          <section key={k} className="border-t border-line pt-4">
            <p className={`${small} font-medium text-muted`}>{LABEL[k]}</p>
            <p className={`mt-1 ${body} text-ink`}>{fields[k]?.value}</p>
          </section>
        ))}
      </div>
      <footer className="flex min-h-20 items-center justify-between gap-3 border-t border-line bg-paper-2 px-6 py-3 text-sm text-ok">
        <span className="flex items-center gap-2">
          <IconCheck className="h-5 w-5 shrink-0" />
          <span className="text-muted">診断や評価ではなく、本人の言葉です。</span>
        </span>
        {stamp && !draft && <Seal date={stampDate} animate={animateStamp} />}
      </footer>
    </article>
  );
}
