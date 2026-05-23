"use client";

import { ArrowRight, Clock3, Mic2, UserRound, Volume2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

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
    useState<TodayRecommendation | null>(initialRecommendation);
  const [failed, setFailed] = useState(false);
  const visibleRecommendation =
    recommendation ?? (failed ? errorRecommendation : loadingRecommendation);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendation() {
      try {
        const response = await fetch("/api/today-recommendation", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load today recommendation.");
        }

        const payload = (await response.json()) as {
          recommendation?: TodayRecommendation;
        };

        if (!payload.recommendation) {
          throw new Error("Today recommendation payload is empty.");
        }

        setRecommendation(payload.recommendation);
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
  }, []);

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[var(--primary)]">
            今日建议你练
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {visibleRecommendation.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {visibleRecommendation.reason}
          </p>
        </div>

        <Link
          href={visibleRecommendation.href}
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
