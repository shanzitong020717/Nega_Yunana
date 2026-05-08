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
    title: "Privacy objection challenge",
    detail:
      "Handle a skeptical enterprise buyer asking how meeting data is captured, processed, and governed.",
    duration: "12 min",
    href: "/objection-bank",
  },
  {
    title: "Feature-to-value conversion",
    detail:
      "Turn captions, transcription, translation, and hands-free access into business outcomes.",
    duration: "10 min",
    href: "/practice",
  },
] as const;

const meetingPrepSteps = [
  {
    title: "Upload the customer material",
    detail: "Deck, proposal, product brief, meeting notes, or customer requirement document.",
  },
  {
    title: "Create a customer-facing brief",
    detail: "AI extracts likely questions, technical concerns, and discovery prompts.",
  },
  {
    title: "Practice the meeting flow",
    detail: "Rehearse opening, discovery, demo narration, objections, and next steps.",
  },
] as const;

const recentMaterials = [
  {
    title: "Enterprise multilingual meeting deck",
    type: "Customer deck",
    status: "Ready for simulation",
  },
  {
    title: "Rokid AR productivity overview",
    type: "Product brief",
    status: "Needs customer questions",
  },
] as const;

const weeklyFocus = [
  "Shorten answers in executive conversations",
  "Connect real-time translation to measurable business value",
  "Ask one discovery question before explaining each feature",
] as const;

const reviewSignals = [
  { label: "Clarity", value: "B+", tone: "primary" as const },
  { label: "Business value", value: "Needs work", tone: "warning" as const },
  { label: "Next step", value: "Strong", tone: "success" as const },
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
        eyebrow="Rokid overseas sales"
        title="Meeting training workspace"
        description="Prepare customer conversations, rehearse with realistic overseas buyers, and turn every practice session into a focused learning loop."
        actions={
          <>
            <Link
              href="/materials"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Upload material
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
            >
              <Mic2 className="h-4 w-4" aria-hidden="true" />
              Start practice
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
                <h2 className="text-lg font-semibold">Today’s recommended drill</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Two short drills are enough for daily momentum: one hard question and one value-based answer.
              </p>
            </div>
            <StatusPill tone="primary">Mock content</StatusPill>
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
            <h2 className="text-lg font-semibold">This Week&apos;s Focus</h2>
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
              <h2 className="text-lg font-semibold">Prepare for a customer meeting</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The material workflow should turn a deck into customer questions, bilingual notes, and a realistic role-play.
            </p>
          </div>
          <Link
            href="/materials"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            Manage materials
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {meetingPrepSteps.map((step, index) => (
            <div key={step.title} className="rounded-md border border-[var(--border)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                Step {index + 1}
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
            <h2 className="text-lg font-semibold">Recent materials</h2>
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
              <h2 className="text-lg font-semibold">Recent review</h2>
            </div>
            <StatusPill tone="warning">Main weakness: feature-only talk</StatusPill>
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
            Review upgraded phrases
          </Link>
        </div>
      </section>
    </>
  );
}
