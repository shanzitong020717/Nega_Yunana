"use client";

import { useState } from "react";
import {
  BookmarkPlus,
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type SentenceReviewPanelProps = {
  reviews: PracticeReviewPayload["sentenceReviews"];
};

type SentenceReview = PracticeReviewPayload["sentenceReviews"][number];
type Issue = SentenceReview["grammarIssues"][number];
type SaveState = "idle" | "saving" | "saved" | "error";

const qualityLabels: Record<SentenceReview["quality"], string> = {
  excellent: "优秀",
  good: "自然",
  needs_improvement: "需要精修",
};

const issueTone: Record<SentenceReview["quality"], "primary" | "neutral" | "warning"> = {
  excellent: "primary",
  good: "neutral",
  needs_improvement: "warning",
};

function IssueList({
  title,
  emptyText,
  issues,
}: {
  title: string;
  emptyText: string;
  issues: Issue[];
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <h4 className="text-sm font-semibold text-[var(--foreground)]">{title}</h4>
      {issues.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {issues.map((issue) => (
            <div
              key={`${issue.type}-${issue.originalFragment}-${issue.correction}`}
              className="rounded-md bg-[var(--surface-subtle)] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="warning">{`严重度 ${issue.severity}/5`}</StatusPill>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {issue.originalFragment}
                </span>
                <span className="text-sm text-[var(--muted)]">→</span>
                <span className="text-sm font-semibold text-[var(--primary-strong)]">
                  {issue.correction}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {issue.explanationZh}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{emptyText}</p>
      )}
    </div>
  );
}

export function SentenceReviewPanel({ reviews }: SentenceReviewPanelProps) {
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  if (reviews.length === 0) {
    return null;
  }

  async function savePhraseCandidate(review: SentenceReview) {
    const candidate = review.phrasebookCandidate;

    if (!candidate) {
      return;
    }

    setSaveStates((currentStates) => ({
      ...currentStates,
      [review.id]: "saving",
    }));

    try {
      const response = await fetch("/api/phrasebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "Business Value",
          english: candidate.english,
          chinese: candidate.chinese,
          useCase: candidate.useCase,
          simpleVersion: review.original,
          professionalVersion: candidate.english,
          tags: candidate.tags,
          source: "review",
          masteryStatus: "needs_practice",
        }),
      });

      if (!response.ok) {
        throw new Error("保存表达失败。");
      }

      setSaveStates((currentStates) => ({
        ...currentStates,
        [review.id]: "saved",
      }));
    } catch {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [review.id]: "error",
      }));
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <MessageSquareText
          className="h-5 w-5 text-[var(--primary)]"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold">逐句精修</h2>
      </div>

      <div className="mt-4 grid gap-4">
        {reviews.map((review, index) => {
          const candidate = review.phrasebookCandidate;
          const saveState = saveStates[review.id] ?? "idle";

          return (
            <article
              key={review.id}
              className="rounded-md border border-[var(--border)] bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="neutral">{`第 ${index + 1} 句`}</StatusPill>
                  <StatusPill tone={issueTone[review.quality]}>
                    {qualityLabels[review.quality]}
                  </StatusPill>
                </div>
                {candidate ? (
                  <button
                    type="button"
                    aria-label={`保存到表达库：${candidate.english}`}
                    disabled={saveState === "saving" || saveState === "saved"}
                    onClick={() => {
                      void savePhraseCandidate(review);
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]"
                  >
                    <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                    {saveState === "saving"
                      ? "保存中..."
                      : saveState === "saved"
                        ? "已保存"
                        : saveState === "error"
                          ? "重试保存"
                          : "保存到表达库"}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    原句
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">
                    {review.original}
                  </p>
                  <p className="mt-3 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                    {review.translationZh}
                  </p>
                </div>

                <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    复盘判断
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {review.reasonZh}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-6 text-[var(--primary-strong)]">
                    {review.practicePrompt}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <IssueList
                  title="语法问题"
                  issues={review.grammarIssues}
                  emptyText="没有明显语法错误。"
                />
                <IssueList
                  title="用词问题"
                  issues={review.wordChoiceIssues}
                  emptyText="没有明显用词错误。"
                />
                <IssueList
                  title="自然度问题"
                  issues={review.naturalnessIssues}
                  emptyText="表达已经比较自然。"
                />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-md border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-4 w-4 text-[var(--primary)]"
                      aria-hidden="true"
                    />
                    <h4 className="text-sm font-semibold">亮点表达</h4>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {review.highlights.map((highlight) => (
                      <div
                        key={`${highlight.type}-${highlight.text}`}
                        className="rounded-md bg-[var(--surface-subtle)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {highlight.text}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {highlight.explanationZh}
                        </p>
                        {highlight.alternatives?.length ? (
                          <p className="mt-2 text-xs font-medium text-[var(--primary-strong)]">
                            {`可替换表达：${highlight.alternatives.join(" / ")}`}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      className="h-4 w-4 text-[var(--primary)]"
                      aria-hidden="true"
                    />
                    <h4 className="text-sm font-semibold">更自然表达</h4>
                  </div>
                  {review.upgradedExpression ? (
                    <>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--foreground)]">
                        {review.upgradedExpression}
                      </p>
                      {review.upgradedExpressionZh ? (
                        <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                          {review.upgradedExpressionZh}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      这句话已经比较自然，不需要强行改写。
                    </p>
                  )}
                </div>
              </div>

              {review.vocabulary.length > 0 ? (
                <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="h-4 w-4 text-[var(--primary)]"
                      aria-hidden="true"
                    />
                    <h4 className="text-sm font-semibold">高级词汇</h4>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {review.vocabulary.map((item) => (
                      <div
                        key={`${review.id}-${item.term}`}
                        className="rounded-md bg-[var(--surface-subtle)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {item.term}
                        </p>
                        {item.phonetic ? (
                          <p className="mt-1 text-sm font-medium text-[var(--primary-strong)]">
                            {item.phonetic}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {item.chinese}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          {item.example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
