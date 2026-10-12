/** プライバシーの絵。縁側の床に、鍵つきの箱と、手帳（AI生成）。茶色の背景の上で使う。 */
export default function PrivacyHero({ className = "" }: { className?: string }) {
  return (
    <img
      src="/steps/privacy.jpg"
      alt=""
      aria-hidden
      width={1200}
      height={675}
      className={`h-auto w-56 rounded-2xl shadow-soft ${className}`}
    />
  );
}
