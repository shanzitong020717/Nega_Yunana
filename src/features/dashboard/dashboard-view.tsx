import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  FileText,
  FileUp,
  Mic2,
  ShieldCheck,
  Target,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import type { ProgressSummary } from "@/lib/progress/weakness-store";

const recommendedDrills = [
  {
    title: "隐私异议挑战",
    detail:
      "Handle a skeptical enterprise buyer asking how meeting data is captured, processed, and governed.",
    duration: "12 min",
    href: "/objection-bank",
  },
  {
    title: "功能转价值练习",
    detail:
      "Turn captions, transcription, translation, and hands-free access into business outcomes.",
    duration: "10 min",
    href: "/practice",
  },
] as const;

const meetingPrepSteps = [
  {
    title: "上传客户材料",
    detail: "Deck, proposal, product brief, meeting notes, or customer requirement document.",
  },
  {
    title: "生成客户简报",
    detail: "AI extracts likely questions, technical concerns, and discovery prompts.",
  },
  {
    title: "练习会议流程",
    detail: "Rehearse opening, discovery, demo narration, objections, and next steps.",
  },
] as const;

const recentMaterials = [
  {
    title: "Enterprise multilingual meeting deck",
    type: "客户材料",
    status: "可开始模拟",
  },
  {
    title: "Rokid AR productivity overview",
    type: "产品简报",
    status: "需要客户问题",
  },
] as const;

const weeklyFocus = [
  "Shorten answers in executive conversations",
  "Connect real-time translation to measurable business value",
  "Ask one discovery question before explaining each feature",
] as const;

const reviewSignals = [
  { label: "清晰度", value: "B+", tone: "primary" as const },
  { label: "商业价值", value: "待加强", tone: "warning" as const },
  { label: "下一步", value: "强", tone: "success" as const },
] as const;

type DashboardViewProps = {
  progress?: ProgressSummary;
};

export function DashboardView({ progress }: DashboardViewProps) {
  const weeklyFocusItems =
    progress && progress.recommendedDrills.length > 0
      ? progress.recommendedDrills
      : weeklyFocus;

  return (
    <>
      <PageHeader
        eyebrow="Rokid 海外销售"
        title="会议训练工作台"
        description="Prepare customer conversations, rehearse with realistic overseas buyers, and turn every practice session into a focused learning loop."
        actions={
          <>
            <Link
              href="/materials"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              上传材料
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
            >
              <Mic2 className="h-4 w-4" aria-hidden="true" />
              开始练习
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                <h2 className="text-lg font-semibold">今日推荐练习</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Two short drills are enough for daily momentum: one hard question and one value-based answer.
              </p>
            </div>
            <StatusPill tone="primary">示例内容</StatusPill>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recommendedDrills.map((drill) => (
              <Link
                key={drill.title}
                href={drill.href}
                className="group rounded-md border border-[var(--border)] p-4 transition hover:border-[var(--primary)] hover:bg-[#f6fbfa]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{drill.title}</h3>
                    <p className="mt-1 text-xs font-medium text-[var(--primary-strong)]">
                      {drill.duration}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {drill.detail}
                </p>
              </Link>
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
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">客户会议准备</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The material workflow should turn a deck into customer questions, bilingual notes, and a realistic role-play.
            </p>
          </div>
          <Link
            href="/materials"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            管理材料
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {meetingPrepSteps.map((step, index) => (
            <div key={step.title} className="rounded-md border border-[var(--border)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                步骤 {index + 1}
              </p>
              <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">最近材料</h2>
          </div>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {recentMaterials.map((material) => (
              <div key={material.title} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{material.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{material.type}</p>
                  </div>
                  <StatusPill tone="neutral">{material.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">最近复盘</h2>
            </div>
            <StatusPill tone="warning">主要弱项：只讲功能</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Your answer was clear, but it stayed too close to product features. Next practice should translate every feature into a customer outcome.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {reviewSignals.map((signal) => (
              <div key={signal.label} className="rounded-md border border-[var(--border)] p-3">
                <p className="text-xs text-[var(--muted)]">{signal.label}</p>
                <p className="mt-2 text-sm font-semibold">{signal.value}</p>
              </div>
            ))}
          </div>
          <Link
            href="/phrasebook"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
            复习升级表达
          </Link>
        </div>
      </section>
    </>
  );
}
