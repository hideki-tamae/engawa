import { IconEye, IconLink, IconLock, IconPaper, IconPerson, IconShield, IconSpark, IconUndo } from "@/components/icons";

/** 見出しの横の、小さな絵記号。内容が、ひと目で分かるように。 */
export default function HowIcon({ kind }: { kind: string }) {
  const cls = "h-6 w-6";
  const icon =
    kind === "1" ? <IconPerson className={cls} /> :
    kind === "2" ? <IconSpark className={cls} /> :
    kind === "3" ? <IconEye className={cls} /> :
    kind === "4" ? <IconLock className={cls} /> :
    kind === "5" ? <IconLink className={cls} /> :
    kind === "6" ? <IconPaper className={cls} /> :
    kind === "7" ? <IconUndo className={cls} /> :
    kind === "chart" ? (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ) : <IconShield className={cls} />;
  return (
    <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper-2 text-wood">
      {icon}
    </span>
  );
}
