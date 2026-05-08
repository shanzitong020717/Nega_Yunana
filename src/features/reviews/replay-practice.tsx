import { Mic2, Repeat2, Volume2 } from "lucide-react";

import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type ReplayPracticeProps = {
  upgrades: PracticeReviewPayload["sentenceUpgrades"];
};

const actions = [
  { label: "听一遍", icon: Volume2 },
  { label: "影子跟读", icon: Mic2 },
  { label: "重复练习", icon: Repeat2 },
] as const;

export function ReplayPractice({ upgrades }: ReplayPracticeProps) {
  const practiceItems = upgrades.slice(0, 3);

  return (
    <div className="grid gap-3">
      {practiceItems.map((upgrade) => (
        <article
          key={upgrade.naturalEnglish}
          className="rounded-md border border-[var(--border)] bg-white p-4"
        >
          <p className="text-sm font-medium leading-6 text-[var(--foreground)]">
            {upgrade.naturalEnglish}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {upgrade.practicePrompt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
