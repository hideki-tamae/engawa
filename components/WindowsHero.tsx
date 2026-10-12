/** 窓口の方へ、のページの絵。職員が、手帳を読み、本人に確かめるところ（AI生成。登場人物は架空）。 */
export default function WindowsHero({ className = "" }: { className?: string }) {
  return (
    <img
      src="/steps/windows.jpg"
      alt="窓口の職員が、タブレットで手帳を読み、本人に確かめている"
      width={1200}
      height={675}
      className={`mx-auto aspect-[16/9] w-full max-w-sm rounded-3xl object-cover shadow-soft ${className}`}
    />
  );
}
