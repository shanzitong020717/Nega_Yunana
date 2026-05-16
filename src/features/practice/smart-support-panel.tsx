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

const cueLabels: Record<SmartCue, string> = {
  "Better Phrase": "换个更自然表达",
  "Use Material Point": "使用材料要点",
  "Ask a Discovery Question": "问一个探索问题",
  "Shorten Answer": "缩短回答",
  "Translate This": "翻译这句话",
  "Challenge Me": "挑战我",
};

type SmartSupportPanelProps = {
  onCue: (cue: SmartCue) => void;
};

export function SmartSupportPanel({ onCue }: SmartSupportPanelProps) {
  return (
    <aside className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">提示</h2>
        </div>
        <StatusPill tone="warning">可选</StatusPill>
      </div>

      <div className="mt-5 grid gap-2">
        {cues.map((cue) => (
          <button
            key={cue}
            type="button"
            onClick={() => onCue(cue)}
            className="min-h-11 rounded-md border border-[var(--border)] px-3 text-left text-sm font-medium transition hover:border-[var(--primary)] hover:bg-[#f6fbfa]"
          >
            {cueLabels[cue]}
          </button>
        ))}
      </div>
    </aside>
  );
}
