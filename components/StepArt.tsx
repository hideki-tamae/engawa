/**
 * 各ステップの、小さな絵。書く・質問・確認・見せ方。
 * Aさんの水彩調の絵（AI生成）。静かに。画面が低い端末（キーボードが出ているとき）は、出さない。
 */
type Step = "write" | "ask" | "confirm" | "scope";
type Field = "when" | "where" | "what" | "help";

const SRC: Record<string, string> = {
  write: "/steps/write.jpg",
  confirm: "/steps/confirm.jpg",
  scope: "/steps/scope.jpg",
  "ask-when": "/steps/ask-when.jpg",
  "ask-where": "/steps/ask-where.jpg",
  "ask-what": "/steps/ask-what.jpg",
  "ask-help": "/steps/ask-help.jpg",
};

export default function StepArt({ step, field }: { step: Step; field?: Field }) {
  const src = step === "ask" ? SRC[`ask-${field ?? "what"}`] : SRC[step];
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={1200}
      height={675}
      className="mx-auto mb-4 aspect-[2/1] w-full max-w-md rounded-2xl object-cover shadow-soft print:hidden [@media(max-height:700px)]:hidden"
    />
  );
}
