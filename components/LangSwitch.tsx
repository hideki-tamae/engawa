/** 言語の切り替え。ことばは、翻訳しない（data-no-translate）。切り替えは、ページを読み込み直す。 */
export default function LangSwitch() {
  return (
    <span data-no-translate className="inline-flex items-center gap-2 text-sm">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/?lang=ja" className="inline-flex min-h-11 items-center underline underline-offset-4">日本語</a>
      <span aria-hidden>/</span>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/?lang=en" className="inline-flex min-h-11 items-center underline underline-offset-4">English</a>
    </span>
  );
}
