import { ArrowRight, BarChart3, CheckCircle2, History, Target } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  getDefaultProgressSummary,
  type ProgressSummary,
} from "@/lib/progress/weakness-store";

type ProgressViewProps = {
  progress?: ProgressSummary;
};

function severityTone(severity: number) {
  if (severity >= 4) {
    return "danger" as const;
  }

  if (severity >= 3) {
    return "warning" as const;
  }

  return "success" as const;
}

export function ProgressView({
  progress = getDefaultProgressSummary(),
}: ProgressViewProps) {
  const topWeaknesses =
    progress.topWeaknesses.length > 0
      ? progress.topWeaknesses
      : getDefaultProgressSummary().topWeaknesses;
  const recommendedDrills =
    progress.recommendedDrills.length > 0
      ? progress.recommendedDrills
      : ["Feature-to-value conversion drill"];

  return (
    <>
      <PageHeader
        eyebrow="Progress"
        title="Personal weakness tracker"
        description="Track repeated meeting-performance issues and convert them into the next focused English-speaking drill."
        actions={
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
          >
            Start next drill
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Recent 7-day training count</h2>
          </div>
          <p className="mt-5 text-4xl font-semibold">
            {progress.recentTrainingCount} sessions
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            This count updates as completed practice sessions produce reviews.
          </p>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Recommended Drills</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendedDrills.map((drill) => (
              <div
                key={drill}
                className="flex gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]"
                  aria-hidden="true"
                />
                <span>{drill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Top Weaknesses</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {topWeaknesses.map((metric) => (
              <article
                key={metric.id}
                className="rounded-md border border-[var(--border)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{metric.label}</h3>
                  <StatusPill tone={severityTone(metric.severity)}>
                    {`Severity ${metric.severity}`}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {metric.evidence}
                </p>
                <p className="mt-3 text-sm font-semibold">
                  {metric.recommendedDrill}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Improved Weaknesses</h2>
          </div>
          <div className="mt-4 space-y-3">
            {progress.improvedWeaknesses.length > 0 ? (
              progress.improvedWeaknesses.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-md border border-[var(--border)] p-3"
                >
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {metric.evidence}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                Keep completing reviews to identify weaknesses that are improving.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">History</h2>
        </div>
        <div className="mt-4 divide-y divide-[var(--border)]">
          {progress.history.length > 0 ? (
            progress.history.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {item.evidence}
                    </p>
                  </div>
                  <StatusPill tone="neutral">{item.sessionId}</StatusPill>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Review history will appear here after the first generated review.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
