import { ArrowRight, Clock3, Mic2, UserRound, Volume2 } from "lucide-react";
import Link from "next/link";

import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

type TodayPracticeCardProps = {
  recommendation: TodayRecommendation;
};

export function TodayPracticeCard({ recommendation }: TodayPracticeCardProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[var(--primary)]">
            今日建议你练
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {recommendation.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {recommendation.reason}
          </p>
        </div>

        <Link
          href={recommendation.href}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
        >
          <Mic2 className="h-4 w-4" aria-hidden="true" />
          开始今日练习
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            练习目标
          </dt>
          <dd className="mt-2 text-sm font-semibold">{recommendation.goalLabel}</dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            AI 客户角色
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {recommendation.personaLabel}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            声音包
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {recommendation.voicePackLabel}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            预计时长
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {recommendation.durationMinutes} 分钟
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        使用材料：{recommendation.materialLabel}
      </p>
    </section>
  );
}
