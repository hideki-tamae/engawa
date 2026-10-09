import { type Resource, telHref } from "@/lib/guardrails";

/** 相談先を、1行ずつ。左に名前、右に大きな番号（押すと電話がかかる）。 */
export default function EmergencyList({ items }: { items: Resource[] }) {
  return (
    <ul className="mt-3 divide-y divide-warn/20">
      {items.map((r) => (
        <li key={r.contact}>
          <a href={telHref(r.contact)} className="flex min-h-14 items-center justify-between gap-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-wood">
            <span className="min-w-0">
              <span className="block text-lg font-semibold leading-6">{r.label}</span>
              {r.note && <span className="block text-sm leading-5 text-muted">{r.note}</span>}
            </span>
            <span className="shrink-0 text-2xl font-bold tracking-wide underline underline-offset-4">{r.contact}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
