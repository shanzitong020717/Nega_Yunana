import { ArrowRight, Sparkles, Target, Wrench } from "lucide-react";

import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type ReviewSummaryCardProps = {
  review: PracticeReviewPayload;
};

export function ReviewSummaryCard({ review }: ReviewSummaryCardProps) {
  const bestMoment = review.bestMoments[0] ?? review.meetingOutcome.summary;
  const topImprovement =
    review.topImprovements[0] ?? review.nextSessionRecommendation.focus;
  const nextPractice =
    review.nextSessionRecommendation.drill ??
    review.nextSessionRecommendation.focus;

  const items = [
    {
      label: "这次最好的地方",
      value: bestMoment,
      icon: Sparkles,
    },
    {
      label: "这次最需要改的地方",
      value: topImprovement,
      icon: Wrench,
    },
    {
      label: "下一次建议练什么",
      value: nextPractice,
      icon: Target,
    },
  ] as const;

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">30秒复盘结论</h2>
      </div>
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
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {item.value}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
