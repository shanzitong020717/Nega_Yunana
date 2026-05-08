import { BookOpenCheck } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

export type MaterialBrief = {
  keyMessage: string;
  productPoints: string[];
  customerValue: string[];
  likelyQuestions: string[];
  likelyObjections: string[];
  riskyClaims: string[];
  usefulPhrases: string[];
  glossary: Array<{
    term: string;
    definition: string;
    chinese?: string;
  }>;
  outline: string[];
};

type MaterialBriefViewProps = {
  brief?: MaterialBrief | null;
  status?: string;
};

const fallbackItems = [
  "Key message",
  "Product points",
  "Customer value",
  "Likely questions",
  "Likely objections",
  "Risky claims",
  "Useful phrases",
  "Glossary",
  "Outline",
] as const;

export function MaterialBriefView({ brief, status = "waiting" }: MaterialBriefViewProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Material Brief</h2>
        </div>
        <StatusPill tone={brief ? "success" : "neutral"}>{status}</StatusPill>
      </div>

      {brief ? (
        <div className="mt-5 space-y-4">
          <section className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
              Key Message
            </h3>
            <p className="mt-2 text-sm leading-6">{brief.keyMessage}</p>
          </section>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Product Points", brief.productPoints],
              ["Customer Value", brief.customerValue],
              ["Likely Questions", brief.likelyQuestions],
              ["Likely Objections", brief.likelyObjections],
              ["Risky Claims", brief.riskyClaims],
              ["Useful Phrases", brief.usefulPhrases],
              ["Outline", brief.outline],
            ].map(([title, items]) => (
              <section key={title as string} className="rounded-md border border-[var(--border)] p-4">
                <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
                  {title as string}
                </h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {(items as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fallbackItems.map((item) => (
            <div
              key={item}
              className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
