"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mic2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { personas } from "@/data/personas";
import type { PrepCardRecord } from "@/lib/practice/prep-card-store";

type PracticeSetupProps = {
  prepCards?: PrepCardRecord[];
};

const practiceModes = [
  { value: "presentation_rehearsal", label: "演示汇报练习" },
  { value: "customer_qa", label: "客户问答" },
  { value: "objection_challenge", label: "异议挑战" },
  { value: "solution_meeting", label: "方案会议" },
] as const;

const difficulties = [
  { value: "easy", label: "简单" },
  { value: "normal", label: "普通" },
  { value: "hard", label: "困难" },
  { value: "executive", label: "高管级" },
] as const;

const personaLabels: Record<string, string> = {
  distributor: "渠道商",
  enterprise_buyer: "企业买家",
  technical_lead: "技术负责人",
  procurement_manager: "采购经理",
  skeptical_executive: "谨慎型高管",
  end_user_manager: "终端用户经理",
};

function splitList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function PracticeSetup({ prepCards = [] }: PracticeSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPrepCardId = prepCards[0]?.id ?? "";
  const selectedPrepCardById = useMemo(
    () => new Map(prepCards.map((prepCard) => [prepCard.id, prepCard])),
    [prepCards],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const prepCardId = getString(formData, "prepCardId") || undefined;
    const selectedPrepCard = prepCardId
      ? selectedPrepCardById.get(prepCardId)
      : undefined;
    const materialId =
      getString(formData, "materialId") || selectedPrepCard?.materialId || undefined;

    const payload = {
      mode: getString(formData, "mode"),
      personaId: getString(formData, "personaId"),
      materialId,
      prepCardId,
      difficulty: getString(formData, "difficulty"),
      trainingFocus: splitList(formData.get("trainingFocus")),
    };

    try {
      const response = await fetch("/api/practice-sessions", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
      });
      const result = (await response.json()) as {
        practiceSession?: { id: string };
        error?: { message?: string };
      };

      if (!response.ok || !result.practiceSession) {
        throw new Error(result.error?.message ?? "练习会话创建失败");
      }

      router.push(`/practice/${result.practiceSession.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "练习会话创建失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">练习设置</h2>
        </div>
        <StatusPill tone="primary">创建会话</StatusPill>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-mode">
            练习模式
            <select
              id="practice-mode"
              name="mode"
              defaultValue="customer_qa"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {practiceModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-persona">
            客户角色
            <select
              id="practice-persona"
              name="personaId"
              defaultValue="enterprise_buyer"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {personaLabels[persona.id] ?? persona.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-material-id">
            材料 ID
            <input
              id="practice-material-id"
              name="materialId"
              placeholder="material_..."
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-prep-card">
            准备卡
            <select
              id="practice-prep-card"
              name="prepCardId"
              defaultValue={defaultPrepCardId}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">不使用准备卡</option>
              {prepCards.map((prepCard) => (
                <option key={prepCard.id} value={prepCard.id}>
                  {prepCard.customerType} · {prepCard.meetingGoal}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-difficulty">
            难度
            <select
              id="practice-difficulty"
              name="difficulty"
              defaultValue="normal"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-training-focus">
          训练重点
          <textarea
            id="practice-training-focus"
            name="trainingFocus"
            rows={4}
            placeholder="商业价值&#10;隐私异议&#10;更短回答"
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-[var(--muted)]">
            The next milestone will replace this room with the Realtime voice experience.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "创建中..." : "开始练习"}
          </button>
        </div>
      </form>
    </section>
  );
}
