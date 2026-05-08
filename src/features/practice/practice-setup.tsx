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
  { value: "presentation_rehearsal", label: "Presentation Rehearsal" },
  { value: "customer_qa", label: "Customer Q&A" },
  { value: "objection_challenge", label: "Objection Challenge" },
  { value: "solution_meeting", label: "Solution Meeting" },
] as const;

const difficulties = [
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "executive", label: "Executive" },
] as const;

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
        throw new Error(result.error?.message ?? "Practice session creation failed");
      }

      router.push(`/practice/${result.practiceSession.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Practice session creation failed",
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
          <h2 className="text-lg font-semibold">Practice setup</h2>
        </div>
        <StatusPill tone="primary">Creates session</StatusPill>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-mode">
            Mode
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
            Persona
            <select
              id="practice-persona"
              name="personaId"
              defaultValue="enterprise_buyer"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-material-id">
            Material ID
            <input
              id="practice-material-id"
              name="materialId"
              placeholder="material_..."
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-prep-card">
            Prep Card
            <select
              id="practice-prep-card"
              name="prepCardId"
              defaultValue={defaultPrepCardId}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">No prep card</option>
              {prepCards.map((prepCard) => (
                <option key={prepCard.id} value={prepCard.id}>
                  {prepCard.customerType} · {prepCard.meetingGoal}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="practice-difficulty">
            Difficulty
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
          Training focus
          <textarea
            id="practice-training-focus"
            name="trainingFocus"
            rows={4}
            placeholder="business value&#10;privacy objection&#10;shorter answers"
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
            {isSubmitting ? "Creating..." : "Start practice"}
          </button>
        </div>
      </form>
    </section>
  );
}
