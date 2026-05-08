"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  FileText,
  Lightbulb,
  ListChecks,
  Trash2,
  Target,
} from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { ReplayPractice } from "@/features/reviews/replay-practice";
import { SentenceUpgradeTable } from "@/features/reviews/sentence-upgrade-table";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type ReviewViewProps = {
  reviewId: string;
  sessionId: string;
  review: PracticeReviewPayload;
};

const scoreLabels: Record<keyof PracticeReviewPayload["scores"], string> = {
  clarity: "Clarity",
  businessConfidence: "Business Confidence",
  discoverySkill: "Discovery Skill",
  productPositioning: "Product Positioning",
  objectionHandling: "Objection Handling",
  englishNaturalness: "English Naturalness",
};

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Target;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-[var(--border)] p-3">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ReviewView({ reviewId, sessionId, review }: ReviewViewProps) {
  const [pendingPrivacyAction, setPendingPrivacyAction] = useState<string | null>(
    null,
  );
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);

  async function deletePracticeData(
    action: string,
    endpoint: string,
    successMessage: string,
  ) {
    setPendingPrivacyAction(action);
    setPrivacyMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete request failed");
      }

      setPrivacyMessage(successMessage);
    } catch {
      setPrivacyMessage("Deletion failed. Please try again.");
    } finally {
      setPendingPrivacyAction(null);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="primary">{reviewId}</StatusPill>
          <StatusPill tone="neutral">{sessionId}</StatusPill>
        </div>
        <h2 className="mt-4 text-xl font-semibold">Meeting Outcome</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {review.meetingOutcome.summary}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Customer Reaction
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.meetingOutcome.customerReaction}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Next Step
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.meetingOutcome.nextStep}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Privacy Controls</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Remove sensitive practice artifacts for this session when they
              should no longer be retained.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pendingPrivacyAction === "review"}
              onClick={() =>
                void deletePracticeData(
                  "review",
                  `/api/practice-sessions/${sessionId}/review`,
                  "Review deleted.",
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "review"
                ? "Deleting..."
                : "Delete this review"}
            </button>
            <button
              type="button"
              disabled={pendingPrivacyAction === "transcript"}
              onClick={() =>
                void deletePracticeData(
                  "transcript",
                  `/api/practice-sessions/${sessionId}/transcript`,
                  "Transcript deleted.",
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "transcript"
                ? "Deleting..."
                : "Delete transcript"}
            </button>
            <button
              type="button"
              disabled={pendingPrivacyAction === "session"}
              onClick={() =>
                void deletePracticeData(
                  "session",
                  `/api/practice-sessions/${sessionId}`,
                  "Practice session deleted.",
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "session"
                ? "Deleting..."
                : "Delete practice session"}
            </button>
          </div>
        </div>
        {privacyMessage ? (
          <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
            {privacyMessage}
          </p>
        ) : null}
      </section>

      <Section title="Business Scorecard" icon={BarChart3}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(review.scores).map(([key, score]) => (
            <article
              key={key}
              className="rounded-md border border-[var(--border)] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {scoreLabels[key as keyof PracticeReviewPayload["scores"]]}
                </h3>
                <StatusPill tone={score.score >= 4 ? "primary" : "warning"}>
                  {`${score.score}/5`}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {score.rationale}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {review.objectionFramework ? (
        <Section title="Objection Framework" icon={ListChecks}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-md border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                Required Steps
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {review.objectionFramework.requiredSteps.map((step) => {
                  const isUsed = review.objectionFramework?.usedSteps.includes(step);

                  return (
                    <span
                      key={step}
                      className={
                        isUsed
                          ? "rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]"
                          : "rounded-md border border-[#f3c5a5] bg-[#fff5ed] px-2.5 py-1 text-xs font-medium text-[var(--warning)]"
                      }
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                Framework Gap
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                {`Missing: ${
                  review.objectionFramework.missingSteps.length > 0
                    ? review.objectionFramework.missingSteps.join(", ")
                    : "None"
                }`}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {review.objectionFramework.coachingNote}
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Top 3 Improvements" icon={ListChecks}>
          <BulletList items={review.topImprovements} />
        </Section>

        <Section title="Best Moments" icon={Award}>
          <BulletList items={review.bestMoments} />
        </Section>
      </div>

      <Section title="Sentence Upgrade" icon={Lightbulb}>
        <SentenceUpgradeTable upgrades={review.sentenceUpgrades} />
      </Section>

      <Section title="Material Coverage" icon={FileText}>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--primary-strong)]">
              Covered
            </h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.covered} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--warning)]">Missed</h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.missed} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--muted)]">Unclear</h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.unclear} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Replay Practice" icon={CheckCircle2}>
        <ReplayPractice upgrades={review.sentenceUpgrades} />
      </Section>

      <Section title="Phrasebook Suggestions" icon={Lightbulb}>
        <div className="grid gap-3 lg:grid-cols-2">
          {review.phrasebookSuggestions.map((phrase) => (
            <article
              key={phrase.english}
              className="rounded-md border border-[var(--border)] bg-white p-4"
            >
              <StatusPill tone="neutral">{phrase.category}</StatusPill>
              <p className="mt-3 text-sm font-medium leading-6 text-[var(--foreground)]">
                {phrase.english}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {phrase.chinese}
              </p>
              <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                {phrase.useCase}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Next Session Recommendation" icon={Target}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Focus
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.nextSessionRecommendation.focus}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Drill
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.nextSessionRecommendation.drill}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Prompt
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.nextSessionRecommendation.prompt}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
