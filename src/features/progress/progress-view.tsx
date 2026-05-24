"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  History,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  getDefaultProgressSummary,
  type ProgressSummary,
} from "@/lib/progress/weakness-store";
import type {
  ReviewAnalyticsRange,
  ReviewAnalyticsSnapshot,
} from "@/lib/validation/review-analytics";

type ProgressViewProps = {
  analytics?: ReviewAnalyticsSnapshot | null;
  progress?: ProgressSummary;
};

const rangeLabels: Record<ReviewAnalyticsRange, string> = {
  "7d": "近 7 天",
  "30d": "近 30 天",
  all: "全部时间",
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
  analytics = null,
  progress = getDefaultProgressSummary(),
}: ProgressViewProps) {
  const [selectedRange, setSelectedRange] = useState<ReviewAnalyticsRange>(
    analytics?.range ?? "7d",
  );
  const [currentAnalytics, setCurrentAnalytics] =
    useState<ReviewAnalyticsSnapshot | null>(analytics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const topWeaknesses =
    progress.topWeaknesses.length > 0
      ? progress.topWeaknesses
      : getDefaultProgressSummary().topWeaknesses;
  const recommendedDrills =
    progress.recommendedDrills.length > 0
      ? progress.recommendedDrills
      : ["Feature-to-value conversion drill"];
  const nextPlanHref = currentAnalytics
    ? `/practice?source=review-analytics&goalId=${currentAnalytics.nextTrainingPlan.goalId}&personaId=${currentAnalytics.nextTrainingPlan.personaId}&voicePackId=${currentAnalytics.nextTrainingPlan.voicePackId}&materialMode=${currentAnalytics.nextTrainingPlan.materialMode}`
    : "/practice";

  async function loadAnalytics(range: ReviewAnalyticsRange, force = false) {
    setSelectedRange(range);
    setIsRefreshing(true);

    try {
      const response = await fetch(
        force
          ? "/api/review-analytics"
          : `/api/review-analytics?range=${range}`,
        force
          ? {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ range }),
            }
          : undefined,
      );
      const payload = (await response.json()) as {
        analytics?: ReviewAnalyticsSnapshot;
      };

      if (response.ok && payload.analytics) {
        setCurrentAnalytics(payload.analytics);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="复盘"
        title="复盘与弱项追踪"
        description="查看最近练习总结、长期弱点和下一次建议，把每次对话转化成下一轮更聚焦的训练。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/memory"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              我的记忆
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
            >
              开始下一组练习
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        }
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5 text-[var(--primary)]"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold">长期复盘</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              按 7 天、30 天和全部时间查看长期错误、成长亮点、表达资产和下一阶段训练计划。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(rangeLabels) as ReviewAnalyticsRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => void loadAnalytics(range)}
                className={`min-h-10 rounded-md border px-3 text-sm font-medium transition ${
                  selectedRange === range
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                {rangeLabels[range]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadAnalytics(selectedRange, true)}
              disabled={isRefreshing}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              重新计算
            </button>
          </div>
        </div>

        {currentAnalytics ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)]">
                    {rangeLabels[currentAnalytics.range]} · {currentAnalytics.trainingCount} 次练习
                  </p>
                  <p className="mt-2 text-base leading-7">
                    {currentAnalytics.summaryZh}
                  </p>
                </div>
                <StatusPill tone={currentAnalytics.aiGenerated ? "success" : "neutral"}>
                  {currentAnalytics.aiGenerated ? "AI 综合总结" : "本地统计"}
                </StatusPill>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-md border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5 text-[var(--warning)]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">经常犯的错误</h3>
                </div>
                <div className="mt-3 space-y-3">
                  {currentAnalytics.recurringMistakes.length > 0 ? (
                    currentAnalytics.recurringMistakes.slice(0, 3).map((mistake) => (
                      <article
                        key={mistake.id}
                        className="rounded-md border border-[var(--border)] p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold">{mistake.title}</p>
                          <StatusPill tone={severityTone(mistake.averageSeverity)}>
                            {`${mistake.occurrenceCount} 次`}
                          </StatusPill>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {mistake.examples[0]?.explanationZh}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {mistake.recommendedDrill}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      还没有形成稳定的重复错误。
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-5 w-5 text-[var(--success)]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">成长亮点</h3>
                </div>
                <div className="mt-3 space-y-3">
                  {currentAnalytics.topGrowthSignals.length > 0 ? (
                    currentAnalytics.topGrowthSignals.slice(0, 3).map((signal) => (
                      <article
                        key={signal.id}
                        className="rounded-md border border-[var(--border)] p-3"
                      >
                        <p className="font-semibold">{signal.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {signal.summaryZh}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      完成更多复盘后，这里会肯定你稳定做好的表达习惯。
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-md border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2">
                  <BookOpen
                    className="h-5 w-5 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">表达与词汇资产</h3>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {currentAnalytics.phraseGrowth.vocabularyItems
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.term}
                        className="rounded-md bg-[var(--surface-subtle)] p-3"
                      >
                        <p className="font-semibold">{item.term}</p>
                        <p className="mt-1 text-sm text-[var(--primary)]">
                          {item.chinese}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {item.example}
                        </p>
                      </div>
                    ))}
                  {currentAnalytics.phraseGrowth.vocabularyItems.length === 0 && (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      还没有足够的高级词汇复用记录。
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center gap-2">
                  <Target
                    className="h-5 w-5 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">下一阶段训练计划</h3>
                </div>
                <p className="mt-3 text-lg font-semibold">
                  {currentAnalytics.nextTrainingPlan.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {currentAnalytics.nextTrainingPlan.reasonZh}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentAnalytics.nextTrainingPlan.focusTags.map((tag) => (
                    <StatusPill key={tag} tone="neutral">
                      {tag}
                    </StatusPill>
                  ))}
                </div>
                <Link
                  href={nextPlanHref}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
                >
                  用这个计划练习
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-5">
            <p className="font-semibold">
              完成 2 次以上练习后，系统会生成长期趋势复盘。
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              长期复盘会统计一周、一个月和全部时间里的重复错误、成长亮点、表达资产和下一阶段练习建议。
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">近 7 天训练次数</h2>
          </div>
          <p className="mt-5 text-4xl font-semibold">
            {progress.recentTrainingCount} 次会话
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            This count updates as completed practice sessions produce reviews.
          </p>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">推荐练习</h2>
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

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">我的记忆</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              这里会集中展示 AI 记住的材料、说话习惯和长期弱点。记忆中心将在后续 milestone 开启管理入口。
            </p>
          </div>
          <Link
            href="/memory"
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            管理记忆
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">主要弱项</h2>
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
                    {`严重度 ${metric.severity}`}
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
            <h2 className="text-lg font-semibold">已有改善的弱项</h2>
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
          <h2 className="text-lg font-semibold">历史记录</h2>
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
