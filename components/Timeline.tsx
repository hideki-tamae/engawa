import type { AuditEntry } from "@/lib/audit-chain";
import { IconBuilding, IconCheck, IconPerson, IconSend, IconUndo } from "./icons";

type Mode = "person" | "window";

const LABEL: Record<Mode, Record<string, string>> = {
  person: {
    card_created: "手帳を作りました",
    shared: "見せる範囲を選びました",
    read_back: "窓口が手帳を開きました",
    confirmed: "読み返して、「合っている」と答えました",
    corrected: "読み返して、「違う」と答えました",
    handoff: "次の相談先へ引き継がれました",
    withdrawn: "取り下げました",
  },
  window: {
    card_created: "手帳ができた",
    shared: "本人が見せる範囲を選んだ",
    read_back: "窓口が開いた",
    confirmed: "本人が「合っている」と確認した",
    corrected: "本人が「違う」と言った（訂正）",
    handoff: "次の相談先へ引き継いだ",
    withdrawn: "本人が取り下げた",
  },
};

function iconFor(type: string) {
  if (type === "read_back") return <IconBuilding className="h-5 w-5" />;
  if (type === "confirmed") return <IconCheck className="h-5 w-5" />;
  if (type === "handoff") return <IconSend className="h-5 w-5" />;
  if (type === "withdrawn" || type === "corrected") return <IconUndo className="h-5 w-5" />;
  return <IconPerson className="h-5 w-5" />;
}

function tone(type: string) {
  if (type === "confirmed") return "bg-ok text-paper";
  if (type === "withdrawn" || type === "corrected") return "bg-warn text-paper";
  if (type === "read_back" || type === "handoff") return "bg-wood text-paper";
  return "bg-paper-3 text-wood-dark";
}

/** 誰がいつ何をしたかを、縦の線でつなぐ。本文は記録に含まれない。 */
export default function Timeline({ log, mode }: { log: AuditEntry[]; mode: Mode }) {
  return (
    <ol className="relative space-y-4" aria-label="経過の記録">
      <span aria-hidden className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-line" />
      {log.map((e) => (
        <li key={e.seq} className="relative flex items-start gap-4">
          <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone(e.type)}`}>
            {iconFor(e.type)}
          </span>
          <div className="pt-1.5">
            <p className="text-base leading-6 text-ink">
              {LABEL[mode][e.type] ?? e.type}
              {e.type === "read_back" && e.detail.window ? (
                <span className="ml-1 text-muted">（{String(e.detail.window)}）</span>
              ) : null}
            </p>
            <p className="text-xs text-muted/80">
              {new Date(e.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
