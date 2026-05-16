"use client";

import { CheckCircle2, Edit3, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type MemoryCandidatesProps = {
  candidates: PracticeReviewPayload["memoryCandidates"];
};

const sensitivityLabels: Record<
  PracticeReviewPayload["memoryCandidates"][number]["sensitivity"],
  string
> = {
  low: "低敏感",
  medium: "中敏感",
  high: "高敏感",
};

const sensitivityTones: Record<
  PracticeReviewPayload["memoryCandidates"][number]["sensitivity"],
  "neutral" | "warning" | "danger"
> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function MemoryCandidates({ candidates }: MemoryCandidatesProps) {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (candidates.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">可沉淀记忆</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActionStatus("已选择保存全部记忆候选。")}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            保存全部
          </button>
          <button
            type="button"
            onClick={() => setActionStatus("已进入逐条编辑记忆候选。")}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
            逐条编辑
          </button>
          <button
            type="button"
            onClick={() => setActionStatus("本次记忆候选不会保存。")}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--danger)]"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            不保存
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {candidates.map((candidate) => (
          <article
            key={`${candidate.type}-${candidate.title}`}
            className="rounded-md border border-[var(--border)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                  {candidate.type}
                </p>
                <h3 className="mt-2 text-sm font-semibold">{candidate.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={sensitivityTones[candidate.sensitivity]}>
                  {sensitivityLabels[candidate.sensitivity]}
                </StatusPill>
                <StatusPill tone="primary">
                  {`${Math.round(candidate.confidence * 100)}%`}
                </StatusPill>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {candidate.summary}
            </p>
          </article>
        ))}
      </div>

      {actionStatus ? (
        <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
          {actionStatus}
        </p>
      ) : null}
    </section>
  );
}
