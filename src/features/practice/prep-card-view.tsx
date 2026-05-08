import { BookOpenCheck } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { PrepCardRecord } from "@/lib/practice/prep-card-store";

type PrepCardViewProps = {
  prepCard?: PrepCardRecord | null;
};

const emptySections = [
  "Customer Context",
  "Meeting Goal",
  "Key Talking Points",
  "Discovery Questions",
  "Likely Objections",
  "Opening Script",
  "Must-Use Phrases",
  "Do Not Overpromise",
] as const;

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-md border border-[var(--border)] p-4">
      <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function PrepCardView({ prepCard }: PrepCardViewProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Meeting prep card</h2>
        </div>
        <StatusPill tone={prepCard ? "success" : "neutral"}>
          {prepCard ? "ready" : "waiting"}
        </StatusPill>
      </div>

      {prepCard ? (
        <div className="mt-5 space-y-4">
          <section className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
              Customer Context
            </h3>
            <p className="mt-2 text-sm leading-6">{prepCard.customerContext}</p>
          </section>
          <section className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
              Meeting Goal
            </h3>
            <p className="mt-2 text-sm leading-6">{prepCard.meetingGoal}</p>
          </section>
          <div className="grid gap-3 lg:grid-cols-2">
            <ListSection title="Key Talking Points" items={prepCard.keyTalkingPoints} />
            <ListSection title="Discovery Questions" items={prepCard.discoveryQuestions} />
            <ListSection title="Likely Objections" items={prepCard.likelyObjections} />
            <ListSection title="Must-Use Phrases" items={prepCard.mustUsePhrases} />
          </div>
          <section className="rounded-md border border-[var(--border)] p-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
              Opening Script
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {prepCard.openingScript}
            </p>
          </section>
          <ListSection title="Do Not Overpromise" items={prepCard.doNotOverpromise} />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {emptySections.map((section) => (
            <div
              key={section}
              className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]"
            >
              {section}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
