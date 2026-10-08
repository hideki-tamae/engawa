import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconCheck } from "./icons";

const focus = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-wood";

type Variant = "primary" | "quiet" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-wood text-paper shadow-[0_6px_16px_rgb(122_90_47/0.32)] hover:bg-wood-dark active:translate-y-px disabled:bg-paper-3 disabled:text-muted/70 disabled:shadow-none",
  quiet:
    "border-2 border-wood/45 bg-paper text-wood-dark hover:border-wood hover:bg-paper-2 active:translate-y-px disabled:opacity-45",
  ghost: "text-wood-dark underline-offset-4 hover:underline disabled:opacity-45",
  danger: "border-2 border-warn/40 bg-paper text-warn hover:bg-warn-bg active:translate-y-px disabled:opacity-45",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-lg font-semibold transition-all duration-150 ${variants[variant]} ${focus} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...props} className={buttonClass(variant, className)} />;
}

/** 複数選択できる選択肢。選ばれたら、色と印（✓）の両方で分かる。 */
export function Chip({
  pressed,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      {...props}
      className={`inline-flex min-h-13 items-center gap-2 rounded-full border-2 px-5 text-lg transition-all duration-150 active:scale-[0.98] ${focus} ${
        pressed
          ? "border-wood bg-wood text-paper shadow-[0_4px_12px_rgb(122_90_47/0.28)]"
          : "border-line bg-paper text-ink hover:border-wood/60 hover:bg-paper-2"
      }`}
    >
      {pressed && <IconCheck className="h-5 w-5 shrink-0" />}
      {children}
    </button>
  );
}

/** いま何番目か。数字と言葉の両方で示す。 */
export function StepDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="進み具合" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5" aria-current={i === current ? "step" : undefined}>
            <span
              className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                i < current ? "bg-wood" : i === current ? "bg-wood/70" : "bg-line"
              }`}
            />
            <span className={`text-xs ${i === current ? "font-semibold text-wood-dark" : "text-muted/80"}`}>{s}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Notice({
  tone,
  children,
  role,
}: {
  tone: "warn" | "ok" | "info";
  children: ReactNode;
  role?: "alert" | "status";
}) {
  const t = {
    warn: "border-warn/35 bg-warn-bg text-ink",
    ok: "border-ok/35 bg-ok-bg text-ink",
    info: "border-line bg-paper-2 text-ink",
  }[tone];
  return (
    <div role={role} className={`rounded-2xl border p-4 text-base leading-7 ${t}`}>
      {children}
    </div>
  );
}
