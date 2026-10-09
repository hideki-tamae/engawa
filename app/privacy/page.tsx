import Link from "next/link";
import { IconBack, IconLock } from "@/components/icons";

export const metadata = {
  title: "個人情報の扱い｜Engawa",
  description: "何を、どこに、どれだけ保存するか。預からないもの。いまの限界。",
};

const ROWS: { what: string; where: string; howLong: string }[] = [
  { what: "手帳の中身（あなたの言葉と、4つの項目）", where: "サーバー（東京）", howLong: "30日で自動削除。取り下げると、すぐ消える" },
  { what: "記録（いつ・誰が・何をしたか。本文は入らない）", where: "サーバー（東京）", howLong: "30日で自動削除" },
  { what: "基本情報（名前・住所・電話）、カバー、書きかけ", where: "あなたの端末の中だけ", howLong: "あなたが消すまで。サーバーには送らない" },
  { what: "声", where: "文字にするため、Google の音声認識に送る", howLong: "声は、保存しない" },
  { what: "窓口の方の申込（組織名・メール）", where: "サーバー（東京）", howLong: "180日で自動削除" },
  { what: "試用の計測（かかった時間、最後まで進んだか）", where: "サーバー（東京）", howLong: "90日。言葉や内容は、入らない" },
];

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
          <IconBack className="h-4 w-4" />
          手帳にもどる
        </Link>
        <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold">
          <IconLock className="h-8 w-8 text-wood" />
          個人情報の扱い
        </h1>
        <p className="mt-3 text-base leading-8 text-muted">
          Engawa は、試用の段階です。何を、どこに、どれだけ残すかを、正直に書きます。
        </p>

        <h2 className="mt-8 text-xl font-bold">何を、どこに、どれだけ</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[34rem] text-left text-sm leading-7">
            <thead className="bg-paper-2">
              <tr>
                <th className="px-4 py-2.5 font-bold">もの</th>
                <th className="px-4 py-2.5 font-bold">どこに</th>
                <th className="px-4 py-2.5 font-bold">どれだけ</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.what} className="border-t border-line align-top">
                  <td className="px-4 py-2.5">{r.what}</td>
                  <td className="px-4 py-2.5">{r.where}</td>
                  <td className="px-4 py-2.5">{r.howLong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-xl font-bold">預からないもの</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-base leading-8">
          <li>マイナンバー、身分証の写真（免許証・保険証・パスポートなど）</li>
          <li>声の録音データ</li>
          <li>広告や、データ販売のための情報（行いません）</li>
        </ul>

        <h2 className="mt-8 text-xl font-bold">AI の扱い</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-base leading-8">
          <li>次の質問を考えるため、あなたの言葉を、Google Cloud の AI（Gemini）に送ります。</li>
          <li>AI に渡す前と、返ってきたあとに、攻撃文が混ざっていないかを検査します（Google の Model Armor）。</li>
          <li>AI が出したものは、必ず検証します。通らなければ、固定の質問に戻します。</li>
          <li>ログに、あなたの言葉は、入れません。</li>
        </ul>

        <h2 className="mt-8 text-xl font-bold">取り下げ</h2>
        <p className="mt-3 text-base leading-8">
          手帳のページで「取り下げる」を押すと、窓口は見られなくなり、<strong>サーバーの本文も消えます</strong>。記録（本文のない骨組み）だけが、残ります。
        </p>

        <h2 className="mt-8 text-xl font-bold">いまの限界（正直に）</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-8">
          <li>電話番号・メール・郵便番号・12桁の番号は、自動で止めます。<strong>名前や住所は、自動では、見分けられません。</strong>手帳には、名前や住所を書かないでください。</li>
          <li>手帳のリンクを知っている人は、読めます。リンクは、他の人に見せないでください。</li>
          <li>AI の処理は、Google Cloud のグローバルな基盤で行います。処理される場所は、日本に限りません。</li>
          <li>窓口のログインは、試用の窓口に、共有のものをお渡ししています。個人ごとの権限は、まだありません。</li>
          <li>記録は、書き換えを防ぐものではなく、<strong>書き換えを見つける</strong>ものです。</li>
          <li>現時点で、実在の機関との提携や連携は、ありません。</li>
        </ul>

        <p className="mt-8 text-sm leading-7 text-muted">
          この内容は、実際の動き（コードと設定）に合わせて書いています。変えたときは、ここも更新します。法律の専門家による確認は、まだ受けていません。
        </p>
      </div>
    </main>
  );
}
