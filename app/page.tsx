import Link from "next/link";
import Hero from "@/components/Hero";
import PersonFlow from "@/components/PersonFlow";

const FLOW = [
  { n: "1", t: "書く・話す", d: "うまく書けなくても、一言でも" },
  { n: "2", t: "選ぶ", d: "見せる範囲は、自分で決める" },
  { n: "3", t: "見せる", d: "画面でも、紙でも" },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#fbf6ec]">
      <header className="mx-auto max-w-xl px-5 pt-10 print:hidden">
        <h1 className="text-3xl font-semibold text-[#2d2418]">Engawa（縁側）</h1>
        <p className="mt-2 text-lg leading-8 text-[#4a3a22]">
          困りごとを、あなたの言葉のまま持ち歩ける手帳。窓口が変わっても、同じ話を一からしなくて済むように。
        </p>
      </header>
      <PersonFlow
        intro={
          <div className="mx-auto max-w-xl px-5 print:hidden">
        <Hero />
            <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="使い方の3つの流れ">
              {FLOW.map((f) => (
                <li key={f.n} className="rounded-2xl bg-[#f3ead9] p-3 text-center">
                  <span className="block text-sm text-[#7a5a2f]">{f.n}</span>
                  <span className="block text-base font-semibold text-[#2d2418]">{f.t}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#5b4a33]">{f.d}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-[#5b4a33]">
              仕組みの中身を確認したい方は、
              <Link href="/how" className="underline">
                仕組みを見る
              </Link>
              （作り話の例で、実際に動かした結果を表示します）。
            </p>
          </div>
        }
      />
    </main>
  );
}
