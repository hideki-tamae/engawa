/**
 * 手帳ができたときの、ささやかなお祝いの絵。夕日の縁側で、朱印のついた手帳を胸に抱くAさん（AI生成）。
 * にぎやかにしない（困りごとを書いた直後なので）。
 */
export default function Celebrate({ className = "" }: { className?: string }) {
  return (
    <img
      src="/steps/done.jpg"
      alt="夕日の縁側で、朱印のついた手帳を胸に抱く、Aさん"
      width={1200}
      height={675}
      className={`mx-auto aspect-[16/10] w-full max-w-sm rounded-3xl object-cover shadow-soft ${className}`}
    />
  );
}
