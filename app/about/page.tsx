import Link from "next/link";
import { IconBack } from "@/components/icons";

export const metadata = {
  title: "運営者・著作権・ご利用について｜Engawa",
  description: "Engawa（縁側）の運営者、著作権、試用版としてのご利用上の注意。",
};

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9" aria-labelledby={`a${n}`}>
      <h2 id={`a${n}`} className="flex items-center gap-3 text-xl font-bold">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wood text-base font-bold text-paper">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-base leading-8">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
          <IconBack className="h-4 w-4" />
          手帳にもどる
        </Link>
        <h1 className="mt-4 text-3xl font-bold leading-snug">運営者・著作権・ご利用について</h1>
        <p className="mt-2 text-sm leading-7 text-muted">最終更新：2026年10月11日</p>

        <Section n={1} title="運営者・著作権">
          <dl className="grid gap-3 rounded-2xl border border-line bg-paper p-5">
            <div>
              <dt className="text-sm font-semibold text-muted">運営者</dt>
              <dd>田前 秀樹（Hideki Tamae）／屋号：Tech Noir Labs</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">著作権</dt>
              <dd>© 2026 Hideki Tamae. All rights reserved.</dd>
            </div>
          </dl>
          <p>
            「Engawa（縁側）」の名称、画面のデザイン、文章、イラスト、ソースコード、設計は、運営者の著作物です。
          </p>
        </Section>

        <Section n={2} title="してはいけないこと">
          <ul className="list-disc space-y-2 pl-6">
            <li>運営者の許可なく、このサービスの画面・文章・イラスト・設計を、複製・転載・改変・再配布すること。</li>
            <li>このサービスを模した、同種のサービスの提供や、商用の利用を目的として、仕組みを調べること。</li>
            <li>自動のプログラムなどで、過度な負荷をかけること。不正にアクセスすること。</li>
          </ul>
          <p className="text-sm leading-7 text-muted">著作権法で認められる範囲の「引用」（出典を明記したもの）は、問題ありません。</p>
        </Section>

        <Section n={3} title="試用版としての、ご利用上の注意">
          <ul className="list-disc space-y-2 pl-6">
            <li>現在は、試用の段階です。内容や機能は、予告なく変わることがあります。動作や、結果を、保証するものではありません。</li>
            <li>診断・治療・緊急対応のサービスではありません。いま危険を感じているときは、110（警察）・119（救急）にご連絡ください。</li>
            <li>実際の困りごとや、個人情報の入力は、ご遠慮ください（作り話の例で、お試しください）。</li>
            <li>現時点で、実在の機関との提携や連携は、ありません。</li>
          </ul>
          <p className="text-sm leading-7 text-muted">
            データの取り扱いは、<Link href="/privacy" className="underline underline-offset-4">個人情報の扱い</Link>をご覧ください。
          </p>
        </Section>

        <Section n={4} title="お問い合わせ">
          <p>
            <a href="https://note.com/clean_minnow118/message" className="underline underline-offset-4" rel="noopener noreferrer">
              運営者の note のメッセージ
            </a>
            、または、<Link href="/for-windows" className="underline underline-offset-4">窓口の方へ</Link>のページの「無料パイロットの申し込み」から、ご連絡ください。
          </p>
        </Section>
      </div>
    </main>
  );
}
