"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Filter, Languages } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  phraseCategories,
  seedPhrases,
  type PhraseCategory,
  type SeedPhrase,
} from "@/data/seed-phrases";

type PhraseSource = "all" | "built_in" | "personal";
type MasteryStatus = "all" | "new" | "practicing" | "mastered";
type CategoryFilter = "all" | PhraseCategory;

type PhraseItem = SeedPhrase & {
  id: string;
  source: "built_in" | "material" | "review" | "user_added";
  masteryStatus: Exclude<MasteryStatus, "all">;
  createdAt?: string | null;
};

const builtInPhrases: PhraseItem[] = seedPhrases.map((phrase, index) => ({
  ...phrase,
  id: `seed-${index}`,
  source: "built_in",
  masteryStatus: index < 3 ? "practicing" : "new",
}));

const sourceLabels: Record<PhraseSource, string> = {
  all: "All sources",
  built_in: "Built-in",
  personal: "Saved personal",
};

const masteryLabels: Record<MasteryStatus, string> = {
  all: "All mastery",
  new: "New",
  practicing: "Practicing",
  mastered: "Mastered",
};

export function PhrasebookView() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [source, setSource] = useState<PhraseSource>("all");
  const [tag, setTag] = useState("all");
  const [mastery, setMastery] = useState<MasteryStatus>("all");
  const [savedPhrases, setSavedPhrases] = useState<PhraseItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedPhrases() {
      try {
        const response = await fetch("/api/phrasebook");

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { phrases?: PhraseItem[] };

        if (isMounted) {
          setSavedPhrases(
            (payload.phrases ?? []).filter(
              (phrase) => phrase.source !== "built_in",
            ),
          );
        }
      } catch {
        if (isMounted) {
          setSavedPhrases([]);
        }
      }
    }

    void loadSavedPhrases();

    return () => {
      isMounted = false;
    };
  }, []);

  const allPhrases = useMemo(
    () => [...builtInPhrases, ...savedPhrases],
    [savedPhrases],
  );
  const tagOptions = useMemo(
    () =>
      Array.from(new Set(allPhrases.flatMap((phrase) => phrase.tags))).sort(),
    [allPhrases],
  );

  const phrases = useMemo(() => {
    return allPhrases.filter((phrase) => {
      const matchesCategory = category === "all" || phrase.category === category;
      const matchesSource =
        source === "all" ||
        (source === "personal"
          ? phrase.source !== "built_in"
          : phrase.source === source);
      const matchesTag = tag === "all" || phrase.tags.includes(tag);
      const matchesMastery =
        mastery === "all" || phrase.masteryStatus === mastery;

      return matchesCategory && matchesSource && matchesTag && matchesMastery;
    });
  }, [allPhrases, category, source, tag, mastery]);

  return (
    <>
      <PageHeader
        eyebrow="Phrasebook"
        title="Rokid product expression library"
        description="Practice bilingual business English phrases for openings, discovery, demo narration, objections, pilots, and follow-ups."
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-base font-semibold">Phrase filters</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-category">
            Category
            <select
              id="phrase-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="all">All categories</option>
              {phraseCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-source">
            Source
            <select
              id="phrase-source"
              value={source}
              onChange={(event) => setSource(event.target.value as PhraseSource)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {Object.entries(sourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-tag">
            Tag
            <select
              id="phrase-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="all">All tags</option>
              {tagOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-mastery">
            Mastery
            <select
              id="phrase-mastery"
              value={mastery}
              onChange={(event) => setMastery(event.target.value as MasteryStatus)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {Object.entries(masteryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {phrases.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {phrases.map((phrase) => (
                <article
                  key={phrase.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <StatusPill tone="primary">{phrase.category}</StatusPill>
                      <h2 className="mt-3 text-lg font-semibold leading-7">
                        {phrase.english}
                      </h2>
                    </div>
                    <BookOpenText
                      className="h-5 w-5 shrink-0 text-[var(--primary)]"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                      <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Chinese Meaning
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-6">{phrase.chinese}</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Use Case
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {phrase.useCase}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phrase.tags.map((item) => (
                        <span
                          key={item}
                          className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <h2 className="text-lg font-semibold">No phrases match these filters</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Change the category, source, tag, or mastery filter to keep reviewing.
              </p>
            </div>
          )}
        </div>

        <aside className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-base font-semibold">Personal collection</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Saved review expressions appear here with source, tags, and mastery status.
          </p>
          {savedPhrases.length > 0 ? (
            <div className="mt-4 space-y-3">
              {savedPhrases.slice(0, 4).map((phrase) => (
                <div
                  key={phrase.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
                >
                  <StatusPill tone="neutral">{phrase.source}</StatusPill>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {phrase.english}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm font-semibold">No saved personal phrases yet</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Review-generated phrases will appear with source, tags, and mastery status.
              </p>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
