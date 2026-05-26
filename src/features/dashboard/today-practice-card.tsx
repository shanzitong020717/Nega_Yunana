"use client";

import {
  ArrowRight,
  Clock3,
  Mic2,
  RefreshCw,
  UserRound,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildPracticeHrefFromRecommendation,
  type TodayRecommendation,
} from "@/lib/recommendations/today-recommendation";
import {
  fetchTodayRecommendationPackage,
  readTodayRecommendationCache,
  writeTodayRecommendationCache,
} from "@/lib/recommendations/today-recommendation-cache";

type TodayPracticeCardProps = {
  initialRecommendation?: TodayRecommendation | null;
};

const loadingRecommendation = {
  title: "正在生成今日练习建议",
  reason: "正在结合最近复盘、客户材料和长期记忆分析今天最值得练的内容。",
  goalLabel: "AI 分析中",
  personaLabel: "AI 分析中",
  voicePackLabel: "AI 分析中",
  materialLabel: "分析中",
  durationMinutes: null,
  href: "/practice",
} as const;

const errorRecommendation = {
  title: "暂时无法生成今日建议",
  reason: "推荐接口暂时不可用，可以先直接进入练习，稍后刷新再查看个性化建议。",
  goalLabel: "通用练习",
  personaLabel: "默认客户",
  voicePackLabel: "默认音色",
  materialLabel: "系统记忆",
  durationMinutes: null,
  href: "/practice",
} as const;

export function TodayPracticeCard({
  initialRecommendation = null,
}: TodayPracticeCardProps) {
  const [recommendation, setRecommendation] =
    useState<TodayRecommendation | null>(
      () => initialRecommendation ?? readTodayRecommendationCache()?.recommendation ?? null,
    );
  const [failed, setFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const visibleRecommendation =
    recommendation ?? (failed ? errorRecommendation : loadingRecommendation);
  const practiceHref = recommendation
    ? buildPracticeHrefFromRecommendation(recommendation)
    : visibleRecommendation.href;

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendation() {
      if (recommendation) {
        writeTodayRecommendationCache(recommendation);
        return;
      }

      try {
        const nextRecommendation = await fetchTodayRecommendationPackage({
          signal: controller.signal,
        });

        writeTodayRecommendationCache(nextRecommendation);
        setRecommendation(nextRecommendation);
        setFailed(false);
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      }
    }

    void loadRecommendation();

    return () => {
      controller.abort();
    };
  }, [recommendation]);

  async function refreshRecommendation() {
    const controller = new AbortController();

    setIsRefreshing(true);
    setFailed(false);

    try {
      const nextRecommendation = await fetchTodayRecommendationPackage({
        refresh: true,
        signal: controller.signal,
      });

      writeTodayRecommendationCache(nextRecommendation);
      setRecommendation(nextRecommendation);
    } catch {
      setFailed(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--primary)]">
              今日建议你练
            </p>
            <button
              type="button"
              aria-label="刷新今日建议"
              title="刷新今日建议"
              disabled={isRefreshing}
              onClick={refreshRecommendation}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#9ccfca] bg-[#eff9f7] text-[var(--primary-strong)] transition hover:border-[var(--primary)] hover:bg-[#dff3f0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  isRefreshing ? "animate-spin" : "",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {visibleRecommendation.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {visibleRecommendation.reason}
          </p>
        </div>

        <Link
          href={practiceHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#9ccfca] bg-[#dff3f0] px-4 text-sm font-semibold text-[var(--primary-strong)] transition hover:border-[var(--primary)] hover:bg-[#c9ebe6]"
        >
          <Mic2 className="h-4 w-4" aria-hidden="true" />
          快速训练
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            练习目标
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {visibleRecommendation.goalLabel}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            AI 客户角色
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {visibleRecommendation.personaLabel}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            AI Studio 音色
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {visibleRecommendation.voicePackLabel}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            预计时长
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {visibleRecommendation.durationMinutes
              ? `${visibleRecommendation.durationMinutes} 分钟`
              : "生成中"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        使用材料：{visibleRecommendation.materialLabel}
      </p>
    </section>
  );
}
