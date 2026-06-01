"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  FileText,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  Trash2,
  Target,
} from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { MemoryCandidates } from "@/features/reviews/memory-candidates";
import { ReplayPractice } from "@/features/reviews/replay-practice";
import { ReviewSummaryCard } from "@/features/reviews/review-summary-card";
import { SentenceReviewPanel } from "@/features/reviews/sentence-review-panel";
import { SentenceUpgradeTable } from "@/features/reviews/sentence-upgrade-table";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type ReviewViewProps = {
  reviewId: string;
  sessionId: string;
  review: PracticeReviewPayload;
};

const scoreLabels: Record<keyof PracticeReviewPayload["scores"], string> = {
  clarity: "清晰度",
  businessConfidence: "商务自信",
  discoverySkill: "探索提问能力",
  productPositioning: "产品定位",
  objectionHandling: "异议处理",
  englishNaturalness: "英语自然度",
};

const frameworkLabels: Record<string, string> = {
  Acknowledge: "承认顾虑",
  Clarify: "澄清背景",
  Position: "定位价值",
  Support: "补充支撑",
  "Next Step": "推进下一步",
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
  const suggestedAnswers = review.suggestedAnswers ?? [];

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
        throw new Error("删除请求失败");
      }

      setPrivacyMessage(successMessage);
    } catch {
      setPrivacyMessage("删除失败，请稍后重试。");
    } finally {
      setPendingPrivacyAction(null);
    }
  }

  return (
    <div className="grid gap-4">
      <ReviewSummaryCard review={review} />

      <SentenceReviewPanel reviews={review.sentenceReviews} />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="primary">{reviewId}</StatusPill>
          <StatusPill tone="neutral">{sessionId}</StatusPill>
        </div>
        <h2 className="mt-4 text-xl font-semibold">会议结果</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {review.meetingOutcome.summary}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              客户反应
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.meetingOutcome.customerReaction}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              下一步
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
            <h2 className="text-lg font-semibold">隐私控制</h2>
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
                  "复盘已删除。",
                )
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "review"
                ? "删除中..."
                : "删除本次复盘"}
            </button>
            <button
              type="button"
              disabled={pendingPrivacyAction === "transcript"}
              onClick={() =>
                void deletePracticeData(
                  "transcript",
                  `/api/practice-sessions/${sessionId}/transcript`,
                  "转写已删除。",
                )
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "transcript"
                ? "删除中..."
                : "删除转写"}
            </button>
            <button
              type="button"
              disabled={pendingPrivacyAction === "session"}
              onClick={() =>
                void deletePracticeData(
                  "session",
                  `/api/practice-sessions/${sessionId}`,
                  "练习会话已删除。",
                )
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingPrivacyAction === "session"
                ? "删除中..."
                : "删除练习会话"}
            </button>
          </div>
        </div>
        {privacyMessage ? (
          <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
            {privacyMessage}
          </p>
        ) : null}
      </section>

      <Section title="商务评分卡" icon={BarChart3}>
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
        <Section title="异议处理框架" icon={ListChecks}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-md border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                必要步骤
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
                      {frameworkLabels[step] ?? step}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                框架缺口
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                {`缺少：${
                  review.objectionFramework.missingSteps.length > 0
                    ? review.objectionFramework.missingSteps
                        .map((step) => frameworkLabels[step] ?? step)
                        .join(", ")
                    : "无"
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
        <Section title="前三个改进点" icon={ListChecks}>
          <BulletList items={review.topImprovements} />
        </Section>

        <Section title="表现最好的部分" icon={Award}>
          <BulletList items={review.bestMoments} />
        </Section>
      </div>

      <Section title="句子升级" icon={Lightbulb}>
        <SentenceUpgradeTable upgrades={review.sentenceUpgrades} />
      </Section>

      {suggestedAnswers.length > 0 ? (
        <Section title="实时建议回答记录" icon={MessageSquareQuote}>
          <div className="grid gap-3">
            {suggestedAnswers.map((suggestion) => (
              <article
                key={suggestion.id}
                className="rounded-md border border-[var(--border)] bg-white p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-md bg-[var(--surface-subtle)] p-3">
                    <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                      AI 客户问题
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                      {suggestion.aiQuestion.english}
                    </p>
                    <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                      {suggestion.aiQuestion.translationZh}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                      推荐回复
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
                      {suggestion.suggestedReplies[0]?.english}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {suggestion.suggestedReplies[0]?.reason}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="材料覆盖情况" icon={FileText}>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--primary-strong)]">
              已覆盖
            </h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.covered} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--warning)]">遗漏</h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.missed} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--muted)]">不清晰</h3>
            <div className="mt-3">
              <BulletList items={review.materialCoverage.unclear} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="跟读练习" icon={CheckCircle2}>
        <ReplayPractice upgrades={review.sentenceUpgrades} />
      </Section>

      <Section title="表达库建议" icon={Lightbulb}>
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

      <MemoryCandidates candidates={review.memoryCandidates} />

      <Section title="下一次练习建议" icon={Target}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              重点
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.nextSessionRecommendation.focus}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              练习
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {review.nextSessionRecommendation.drill}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              提示
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
