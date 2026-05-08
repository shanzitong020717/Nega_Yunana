"use client";

import { useMemo, useState } from "react";
import { MessageSquareWarning, PlayCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  objectionCategories,
  objections,
  type ObjectionCategory,
} from "@/data/objections";

type CategoryFilter = "All categories" | ObjectionCategory;

const allCategoryLabel = "All categories";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function ObjectionBankView() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>(allCategoryLabel);
  const [query, setQuery] = useState("");
  const [launchingObjectionId, setLaunchingObjectionId] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const filteredObjections = useMemo(() => {
    const normalizedQuery = normalize(query);

    return objections.filter((objection) => {
      const matchesCategory =
        category === allCategoryLabel || objection.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          objection.question,
          objection.customerConcern,
          objection.shortAnswer,
          objection.professionalAnswer,
          objection.followUpQuestion,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  async function launchPractice(objectionId: string) {
    setLaunchingObjectionId(objectionId);
    setLaunchError(null);

    try {
      const response = await fetch("/api/practice-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "objection_challenge",
          personaId: "skeptical_executive",
          difficulty: "normal",
          trainingFocus: ["objection_handling"],
          sourceObjectionId: objectionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create practice session");
      }

      const payload = (await response.json()) as {
        practiceSession?: { id?: string };
      };
      const sessionId = payload.practiceSession?.id;

      if (!sessionId) {
        throw new Error("Practice session response was missing an id");
      }

      router.push(`/practice/${sessionId}`);
    } catch {
      setLaunchError("Could not start this practice session. Please try again.");
    } finally {
      setLaunchingObjectionId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Objection Bank"
        title="Rokid sales objection practice"
        description="Train common overseas customer concerns with structured answer frameworks, short answers, professional answers, and focused practice entry points."
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[0.75fr_1fr_auto] lg:items-end">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="objection-category">
            Category
            <select
              id="objection-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value={allCategoryLabel}>{allCategoryLabel}</option>
              {objectionCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="objection-search">
            Search
            <span className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                aria-hidden="true"
              />
              <input
                id="objection-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search concern, answer, or follow-up"
                className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </span>
          </label>

          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2">
            <p className="text-xs text-[var(--muted)]">Visible cards</p>
            <p className="mt-1 text-lg font-semibold">{filteredObjections.length}</p>
          </div>
        </div>
      </section>

      {filteredObjections.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {launchError ? (
            <div
              role="alert"
              className="rounded-md border border-[#f3c5a5] bg-[#fff5ed] p-3 text-sm font-medium text-[var(--warning)] xl:col-span-2"
            >
              {launchError}
            </div>
          ) : null}

          {filteredObjections.map((objection) => (
            <article
              key={objection.id}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <StatusPill tone="neutral">{objection.category}</StatusPill>
                  <h2 className="mt-3 text-lg font-semibold leading-7">
                    {objection.question}
                  </h2>
                </div>
                <MessageSquareWarning
                  className="h-5 w-5 shrink-0 text-[var(--warning)]"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-5 space-y-4">
                <section>
                  <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Customer Concern
                  </h3>
                  <p className="mt-2 text-sm leading-6">{objection.customerConcern}</p>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Answer Framework
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {objection.answerFramework.map((step) => (
                      <span
                        key={step}
                        className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]"
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Short Answer
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {objection.shortAnswer}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Professional Answer
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {objection.professionalAnswer}
                  </p>
                </section>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Follow-up: {objection.followUpQuestion}
                </p>
                <button
                  type="button"
                  onClick={() => void launchPractice(objection.id)}
                  disabled={launchingObjectionId === objection.id}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:bg-[#8cb9b5]"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  {launchingObjectionId === objection.id ? "Starting..." : "Practice"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold">No objections match these filters</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Clear the search or switch category to keep practicing.
          </p>
        </section>
      )}
    </>
  );
}
