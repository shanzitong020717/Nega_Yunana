import { ArrowRight, Sparkles, Target, Wrench } from "lucide-react";

import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type ReviewSummaryCardProps = {
  review: PracticeReviewPayload;
};

export function ReviewSummaryCard({ review }: ReviewSummaryCardProps) {
  const snapshot = review.reviewSnapshot;
  const bestMoments =
    snapshot?.strengths.length ? snapshot.strengths : review.bestMoments;
  const topImprovements =
    snapshot?.priorityImprovements.length
      ? snapshot.priorityImprovements
      : review.topImprovements;
  const nextPractice = snapshot?.nextPracticeFocus
    ? [snapshot.nextPracticeFocus]
    : [
        review.nextSessionRecommendation.drill ??
          review.nextSessionRecommendation.focus,
      ];

  const items = [
    {
      label: "这次最好的地方",
      values: bestMoments.length ? bestMoments : [review.meetingOutcome.summary],
      icon: Sparkles,
    },
    {
      label: "这次最需要改的地方",
      values: topImprovements.length
        ? topImprovements
        : [review.nextSessionRecommendation.focus],
      icon: Wrench,
    },
    {
      label: "下一次建议练什么",
      values: nextPractice,
      icon: Target,
    },
  ] as const;

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">30秒复盘结论</h2>
      </div>
      {snapshot?.overallSummaryZh ? (
        <p className="mt-4 rounded-md border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--foreground)]">
          {snapshot.overallSummaryZh}
        </p>
      ) : null}
      {snapshot ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[var(--muted)]">
          <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1">
            {`表达库候选 ${snapshot.phrasebookCandidateCount}`}
          </span>
          <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1">
            {`记忆候选 ${snapshot.memoryCandidateCount}`}
          </span>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-md border border-[var(--border)] bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{item.label}</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
                {item.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
