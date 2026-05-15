import { BarChart3, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { QuickActionStrip } from "@/features/dashboard/quick-action-strip";
import { TodayPracticeCard } from "@/features/dashboard/today-practice-card";
import { getTodayRecommendation } from "@/lib/recommendations/today-recommendation";
import type { ProgressSummary } from "@/lib/progress/weakness-store";

const recentMaterials = [
  {
    title: "Enterprise multilingual meeting deck",
    type: "客户材料",
    status: "可用于今日练习",
  },
  {
    title: "Rokid AR productivity overview",
    type: "产品简报",
    status: "等待生成准备卡",
  },
] as const;

const weeklyFocus = [
  "用一句结论先回答客户，再补充原因。",
  "把实时翻译、字幕和免手持操作讲成客户价值。",
  "每解释一个功能前，先问一个探索问题。",
] as const;

const reviewSignals = [
  { label: "最好的地方", value: "能清楚解释实时字幕" },
  { label: "最需要改", value: "隐私回答偏长" },
  { label: "下一次", value: "技术负责人异议处理" },
] as const;

type DashboardViewProps = {
  progress?: ProgressSummary;
};

export function DashboardView({ progress }: DashboardViewProps) {
  const recommendation = getTodayRecommendation();
  const weeklyFocusItems =
    progress && progress.recommendedDrills.length > 0
      ? progress.recommendedDrills
      : weeklyFocus;

  return (
    <>
      <PageHeader
        eyebrow="Rokid 海外销售"
        title="今日练习"
        description="打开后先完成今天最值得练的一次会谈，再用复盘和表达库把它沉淀下来。"
      />

      <TodayPracticeCard recommendation={recommendation} />

      <QuickActionStrip />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">最近材料</h2>
            </div>
            <Link
              href="/materials"
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              管理材料
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {recentMaterials.map((material) => (
              <div key={material.title} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{material.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {material.type}
                    </p>
                  </div>
                  <StatusPill tone="neutral">{material.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">本周重点</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {weeklyFocusItems.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-3 text-sm"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">最近复盘</h2>
          </div>
          <StatusPill tone="warning">主要弱项：隐私回答偏长</StatusPill>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          上次练习中，你已经能说明实时字幕的价值，但在客户追问隐私和部署时解释偏长。下一次应优先练习更短、更有推进力的回答。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {reviewSignals.map((signal) => (
            <div
              key={signal.label}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3"
            >
              <p className="text-xs text-[var(--muted)]">{signal.label}</p>
              <p className="mt-2 text-sm font-semibold">{signal.value}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
