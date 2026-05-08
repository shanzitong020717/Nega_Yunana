"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, WandSparkles } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { PrepCardRecord } from "@/lib/practice/prep-card-store";

type PrepCardFormProps = {
  onCreated: (prepCard: PrepCardRecord) => void;
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

export function PrepCardForm({ onCreated }: PrepCardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      materialId: getString(formData, "materialId") || undefined,
      customerType: getString(formData, "customerType"),
      industry: getString(formData, "industry") || undefined,
      countryOrRegion: getString(formData, "countryOrRegion") || undefined,
      meetingGoal: getString(formData, "meetingGoal"),
      knownConcerns: splitList(formData.get("knownConcerns")),
      trainingFocus: splitList(formData.get("trainingFocus")),
    };

    try {
      const response = await fetch("/api/prep-cards", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
      });
      const result = (await response.json()) as {
        prepCard?: PrepCardRecord;
        error?: { message?: string };
      };

      if (!response.ok || !result.prepCard) {
        throw new Error(result.error?.message ?? "准备卡生成失败");
      }

      onCreated(result.prepCard);
      event.currentTarget.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "准备卡生成失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">生成会议准备卡</h2>
        </div>
        <StatusPill tone="primary">AI 可生成</StatusPill>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-material-id">
          材料 ID
          <input
            id="prep-material-id"
            name="materialId"
            placeholder="material_..."
            className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-customer-type">
            客户类型
            <input
              id="prep-customer-type"
              name="customerType"
              required
              placeholder="企业买家、渠道商、技术负责人"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-industry">
            行业
            <input
              id="prep-industry"
              name="industry"
              placeholder="医疗、教育、制造业"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-country-region">
            国家或地区
            <input
              id="prep-country-region"
              name="countryOrRegion"
              placeholder="新加坡、德国、中东"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-meeting-goal">
            会议目标
            <input
              id="prep-meeting-goal"
              name="meetingGoal"
              required
              placeholder="确认试点、预约演示、处理 IT 审查"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-known-concerns">
            已知顾虑
            <textarea
              id="prep-known-concerns"
              name="knownConcerns"
              rows={4}
              placeholder="隐私&#10;翻译准确率&#10;试点价值"
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="prep-training-focus">
            训练重点
            <textarea
              id="prep-training-focus"
              name="trainingFocus"
              rows={4}
              placeholder="商业价值&#10;探索式问题&#10;更短回答"
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-[var(--muted)]">
            The prep card becomes the bridge between uploaded material and voice practice.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "生成中..." : "生成准备卡"}
          </button>
        </div>
      </form>
    </section>
  );
}
