import type { FieldKey } from "@/lib/card";

const LABEL: Record<FieldKey, string> = {
  what: "どんなこと",
  when: "いつ頃",
  where: "どこで",
  help: "してほしいこと",
};

/** 「困りごとの手帳」を、見える形にしたもの。画面でも、紙でも、同じ見た目を使う。 */
export default function HandbookCard({
  statement,
  fields,
  confirmedAt,
  large = false,
}: {
  statement: string;
  fields: Partial<Record<FieldKey, { value: string }>>;
  confirmedAt?: string;
  large?: boolean;
}) {
  const body = large ? "text-3xl leading-[1.6]" : "text-lg leading-8";
  const small = large ? "text-lg" : "text-sm";
  return (
    <article className="overflow-hidden rounded-2xl border border-[#7a5a2f]/40 bg-[#fbf6ec] shadow-sm">
      <header className="flex items-center justify-between bg-[#7a5a2f] px-5 py-3 text-[#fbf6ec]">
        <span className="text-base font-semibold tracking-wide">困りごとの手帳</span>
        <span className="rounded-full border border-[#fbf6ec]/50 px-3 py-0.5 text-xs">Engawa</span>
      </header>
      <div className="space-y-5 p-5">
        <section>
          <p className={`${small} text-[#5b4a33]`}>本人の言葉</p>
          <p className={`mt-1 ${body} text-[#1f1a12]`}>{statement}</p>
        </section>
        {(Object.keys(LABEL) as FieldKey[])
          .filter((k) => fields[k])
          .map((k) => (
            <section key={k} className="border-t border-[#7a5a2f]/20 pt-4">
              <p className={`${small} text-[#5b4a33]`}>{LABEL[k]}</p>
              <p className={`mt-1 ${body} text-[#1f1a12]`}>{fields[k]?.value}</p>
            </section>
          ))}
      </div>
      <footer className="flex items-center gap-2 border-t border-[#7a5a2f]/20 bg-[#f3ead9] px-5 py-3 text-sm text-[#2f6b3a]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M7 12.5 l3.2 3.2 L17 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>本人が確認しました{confirmedAt ? `（${confirmedAt}）` : ""}。診断や評価ではありません。</span>
      </footer>
    </article>
  );
}
