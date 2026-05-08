type StatusTone = "neutral" | "success" | "warning" | "danger" | "primary";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)]",
  success: "border-[#b7dfc8] bg-[#edf8f1] text-[var(--success)]",
  warning: "border-[#f4d39a] bg-[#fff7e8] text-[var(--warning)]",
  danger: "border-[#f3b8b2] bg-[#fff0ee] text-[var(--danger)]",
  primary: "border-[#b7d8d6] bg-[#e7f4f2] text-[var(--primary-strong)]",
};

type StatusPillProps = {
  children: string;
  tone?: StatusTone;
};

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-medium",
        toneClass[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
