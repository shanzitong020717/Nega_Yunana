"use client";

import { CheckCircle2, Edit3, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type MemoryCandidatesProps = {
  candidates: PracticeReviewPayload["memoryCandidates"];
};

type MemoryCandidate = PracticeReviewPayload["memoryCandidates"][number];

type EditableCandidate = MemoryCandidate & {
  draftTitle: string;
  draftSummary: string;
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
  const [editableCandidates, setEditableCandidates] = useState<EditableCandidate[]>(
    candidates.map((candidate) => ({
      ...candidate,
      draftTitle: candidate.title,
      draftSummary: candidate.summary,
    })),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (candidates.length === 0 || isDismissed) {
    return null;
  }

  function normalizeMemoryType(candidateType: string) {
    const normalizedType = candidateType.toLowerCase();

    if (normalizedType.includes("material")) {
      return "material_context";
    }

    if (normalizedType.includes("customer")) {
      return "customer_context";
    }

    if (normalizedType.includes("weakness")) {
      return "weakness";
    }

    if (normalizedType.includes("phrase")) {
      return "phrase_preference";
    }

    if (normalizedType.includes("practice") || normalizedType.includes("learning")) {
      return "learning_preference";
    }

    if (normalizedType.includes("profile")) {
      return "profile";
    }

    return "speaking_habit";
  }

  async function saveAllCandidates() {
    setIsSaving(true);
    setActionStatus(null);

    try {
      await Promise.all(
        editableCandidates.map((candidate) =>
          fetch("/api/memories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: normalizeMemoryType(candidate.type),
              title: candidate.draftTitle,
              summary: candidate.draftSummary,
              source: "review",
              confidence: candidate.confidence,
              importance: candidate.sensitivity === "high" ? 5 : 3,
              sensitive: candidate.sensitivity === "high",
            }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("保存记忆失败");
            }
          }),
        ),
      );

      setActionStatus(`已保存 ${editableCandidates.length} 条记忆。`);
      setIsEditing(false);
    } catch {
      setActionStatus("记忆保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraft(
    candidateIndex: number,
    field: "draftTitle" | "draftSummary",
    value: string,
  ) {
    setEditableCandidates((currentCandidates) =>
      currentCandidates.map((candidate, index) =>
        index === candidateIndex
          ? {
              ...candidate,
              [field]: value,
            }
          : candidate,
      ),
    );
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
            disabled={isSaving}
            onClick={() => {
              void saveAllCandidates();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "保存中..." : "保存全部"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setActionStatus("已进入逐条编辑记忆候选。");
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
            逐条编辑
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--danger)]"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            不保存
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {editableCandidates.map((candidate, index) => (
          <article
            key={`${candidate.type}-${candidate.title}`}
            className="rounded-md border border-[var(--border)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                  {candidate.type}
                </p>
                <h3 className="mt-2 text-sm font-semibold">{candidate.draftTitle}</h3>
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
              {candidate.draftSummary}
            </p>
            {isEditing ? (
              <div className="mt-4 grid gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  记忆标题
                  <input
                    value={candidate.draftTitle}
                    onChange={(event) =>
                      updateDraft(index, "draftTitle", event.target.value)
                    }
                    className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  记忆摘要
                  <textarea
                    value={candidate.draftSummary}
                    onChange={(event) =>
                      updateDraft(index, "draftSummary", event.target.value)
                    }
                    className="min-h-24 rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ) : null}
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
