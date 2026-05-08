import { FileText } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

const materialPoints = [
  "Real-time translated captions for multilingual customer conversations.",
  "Hands-free access keeps the speaker engaged instead of looking down at a phone.",
  "A focused pilot should define users, workflow, success metrics, and IT review needs.",
] as const;

const mustUsePhrases = [
  "May I first understand your use case?",
  "The key value is reducing communication friction in real time.",
  "We can start with a small pilot before discussing a larger rollout.",
] as const;

export function MaterialNavigator() {
  return (
    <aside className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Material Navigator</h2>
        </div>
        <StatusPill tone="neutral">Mock brief</StatusPill>
      </div>

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
          Use material points
        </h3>
        <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">
          {materialPoints.map((point) => (
            <li key={point} className="rounded-md border border-[var(--border)] p-3">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
          Must-use phrases
        </h3>
        <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">
          {mustUsePhrases.map((phrase) => (
            <li key={phrase} className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] p-3 text-[var(--primary-strong)]">
              {phrase}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
