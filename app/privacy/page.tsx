import Link from "next/link";
import { IconBack, IconCheck, IconLock, IconPhone } from "@/components/icons";
import PrivacyHero from "@/components/PrivacyHero";
import { buttonClass } from "@/components/ui";

export const metadata = {
  title: "プライバシーポリシー｜Engawa",
  description: "データの取得・利用・保存・削除に関する、取り扱い仕様。",
};

const RETENTION: { days: string; title: string; note: string }[] = [
  { days: "30日", title: "手帳の入力データ", note: "本文と4つの項目。「取り下げ」を行うと、即座にサーバーから削除されます。" },
  { days: "30日", title: "操作ログ", note: "いつ・誰が・何をしたかの記録。手帳の本文は含まれません。" },
  { days: "90日", title: "利用統計データ", note: "所要時間・進捗など。入力された言葉やコンテンツ内容は含まれません。" },
  { days: "180日", title: "窓口申込データ", note: "組織名・メールアドレス。" },
];

const LIMITS: { t: string; d: string }[] = [
  { t: "個人情報の入力制限", d: "電話番号・メールアドレス・郵便番号・12桁の識別番号は、自動的にブロックを試みます。ただし、氏名や住所の自動検知・秘匿化の機能は、備わっていません。手帳本文には、ご自身や他者の個人を特定できる情報を、入力しないでください。" },
  { t: "情報処理基盤", d: "AI処理およびデータ処理には、Google Cloud のグローバル基盤を利用しています。データが処理されるサーバーの物理的な場所は、日本国内に限定されない場合があります。" },
  { t: "共有リンクの管理", d: "手帳の共有リンクを知る第三者は、対象ページを閲覧できます。リンクの管理には、十分ご注意ください。" },
  { t: "アクセス権限と改ざん検知", d: "窓口のログインには、試用向けの共有アカウントを用いており、個人ごとの権限付与は行っていません。システムの記録（ログ）は、改ざんを「防ぐ」ものではなく、事後的な「改ざん検知」を目的としています。" },
  { t: "第三者提供・連携", d: "現時点において、実在の公的機関や外部組織との、データ連携・提携・第三者提供は、一切行っていません。" },
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10" aria-labelledby={`s${n}`}>
      <h2 id={`s${n}`} className="flex items-center gap-3 text-xl font-bold">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wood text-base font-bold text-paper">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
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

        <header className="mt-4 rounded-3xl bg-wood px-6 py-8 text-paper shadow-soft">
          <PrivacyHero className="-mt-2" />
          <h1 className="mt-4 text-3xl font-bold leading-snug">プライバシーポリシー</h1>
          <p className="mt-1 text-base font-semibold text-paper/85">データの取り扱いについて</p>
          <p className="mt-4 text-base leading-8 text-paper/90">
            本サービス（Engawa）は、現在、実証実験（ベータ版）の段階にあります。ユーザーデータの取得、利用、保存、および削除に関する取り扱い仕様は、以下のとおりです。
          </p>
        </header>

        <Section n={1} title="取得するデータと保存期間">
          <p className="text-sm leading-7 text-muted">クラウドサーバーで、保存・処理されるデータと、その期間です。期間が過ぎると、自動的に削除されます。</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {RETENTION.map((r) => (
              <li key={r.title} className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
                <p className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-wood-dark">{r.days}</span>
                  <span className="text-base font-bold">{r.title}</span>
                </p>
                <p className="mt-1.5 text-sm leading-7 text-muted">{r.note}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={2} title="サーバーに送信・保存されないデータ">
          <ul className="space-y-3">
            <li className="flex items-start gap-4 rounded-2xl bg-paper-2 p-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-wood"><IconLock className="h-6 w-6" /></span>
              <span>
                <span className="block text-base font-bold">端末内データ</span>
                <span className="block text-sm leading-7 text-muted">基本情報（名前・住所・電話番号）、カバー設定、入力中の下書きは、ユーザーの端末にのみ保存され、当サーバーには送信されません。</span>
              </span>
            </li>
            <li className="flex items-start gap-4 rounded-2xl bg-paper-2 p-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-wood"><IconPhone className="h-6 w-6" /></span>
              <span>
                <span className="block text-base font-bold">音声データ</span>
                <span className="block text-sm leading-7 text-muted">音声入力を利用した場合、テキスト化のために、Google の音声認識 API へ送信されます。音声データ自体は、保存されません。</span>
              </span>
            </li>
          </ul>
        </Section>

        <Section n={3} title="システムの仕様および制限事項">
          <p className="text-sm leading-7 text-muted">ご利用にあたり、現在のシステム仕様として、以下の点にご留意ください。</p>
          <ul className="mt-4 space-y-3">
            {LIMITS.map((l) => (
              <li key={l.t} className="rounded-2xl border border-line bg-paper p-4">
                <p className="flex items-center gap-2 text-base font-bold">
                  <IconCheck className="h-5 w-5 shrink-0 text-wood" />
                  {l.t}
                </p>
                <p className="mt-1.5 pl-7 text-sm leading-7 text-muted">{l.d}</p>
              </li>
            ))}
          </ul>
        </Section>

        <p className="mt-10 rounded-2xl bg-paper-2 p-4 text-sm leading-7 text-muted">
          本ポリシーは、仕様の変更にともない、随時更新されます。
        </p>

        <nav className="mt-10 border-t border-line pt-6 text-center" aria-label="もどる">
          <Link href="/" className={buttonClass("quiet", "w-full")}>
            <IconBack className="h-5 w-5" />
            手帳にもどる
          </Link>
        </nav>
      </div>
    </main>
  );
}
