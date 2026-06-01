import { BookOpenCheck, Languages, Play } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { SeedPhrase } from "@/data/seed-phrases";

export type PhraseMasteryStatus =
  | "new"
  | "needs_practice"
  | "reviewing"
  | "mastered";

export type DailyPhrase = SeedPhrase & {
  id: string;
  masteryStatus: PhraseMasteryStatus;
};

type DailyPhrasePracticeProps = {
  phrases: DailyPhrase[];
};

const masteryLabels: Record<PhraseMasteryStatus, string> = {
  new: "新表达",
  needs_practice: "需要练习",
  reviewing: "复习中",
  mastered: "已掌握",
};

const masteryTones: Record<
  PhraseMasteryStatus,
  "neutral" | "warning" | "primary" | "success"
> = {
  new: "neutral",
  needs_practice: "warning",
  reviewing: "primary",
  mastered: "success",
};

export function DailyPhrasePractice({ phrases }: DailyPhrasePracticeProps) {
  return (
    <section
      aria-label="今天建议复习"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">今天建议复习</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            每天只练 5 句，优先巩固商务会谈中最容易直接用上的表达。
          </p>
        </div>
        <StatusPill tone="primary">{`${phrases.length} 句`}</StatusPill>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {phrases.map((phrase) => (
          <article
            key={phrase.id}
            className="flex min-h-[18rem] flex-col rounded-md border border-[var(--border)] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <StatusPill tone={masteryTones[phrase.masteryStatus]}>
                {masteryLabels[phrase.masteryStatus]}
              </StatusPill>
              <Languages className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-[var(--foreground)]">
              {phrase.english}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {phrase.chinese}
            </p>
            <p className="mt-3 text-xs font-medium leading-5 text-[var(--muted)]">
              {phrase.useCase}
            </p>

            <button
              type="button"
              className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              练这句
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
