/** 「仕組みを見る」の絵。手帳の中身を、虫めがねで、のぞいて確かめるところ（AI生成）。 */
export default function HowHero({ className = "" }: { className?: string }) {
  return (
    <img
      src="/steps/how.jpg"
      alt="虫めがねで、手帳のチェックを確かめるイメージ"
      width={1200}
      height={675}
      className={`mx-auto aspect-[16/9] w-full max-w-sm rounded-3xl object-cover shadow-soft ${className}`}
    />
  );
}
