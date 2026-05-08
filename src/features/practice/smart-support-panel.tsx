import { Lightbulb } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

export type SmartCue =
  | "Better Phrase"
  | "Use Material Point"
  | "Ask a Discovery Question"
  | "Shorten Answer"
  | "Translate This"
  | "Challenge Me";

const cues: SmartCue[] = [
  "Better Phrase",
  "Use Material Point",
  "Ask a Discovery Question",
  "Shorten Answer",
  "Translate This",
  "Challenge Me",
];

type SmartSupportPanelProps = {
  onCue: (cue: SmartCue) => void;
};

export function SmartSupportPanel({ onCue }: SmartSupportPanelProps) {
  return (
    <aside className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Smart Support</h2>
        </div>
        <StatusPill tone="warning">Live cues</StatusPill>
      </div>

      <div className="mt-5 grid gap-2">
        {cues.map((cue) => (
          <button
            key={cue}
            type="button"
            onClick={() => onCue(cue)}
            className="min-h-11 rounded-md border border-[var(--border)] px-3 text-left text-sm font-medium transition hover:border-[var(--primary)] hover:bg-[#f6fbfa]"
          >
            {cue}
          </button>
        ))}
      </div>
    </aside>
  );
}
