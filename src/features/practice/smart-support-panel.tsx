import {
  BookOpenCheck,
  FileText,
  Lightbulb,
  MessageSquareQuote,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

export type SmartCue =
  | "Suggested Answer"
  | "Better Phrase"
  | "Use Material Point"
  | "Ask a Discovery Question"
  | "Challenge Me";

const cueLabels: Record<SmartCue, string> = {
  "Suggested Answer": "建议回答",
  "Better Phrase": "换个更自然表达",
  "Use Material Point": "使用材料要点",
  "Ask a Discovery Question": "问一个探索问题",
  "Challenge Me": "挑战我",
};

const cueIcons: Record<SmartCue, LucideIcon> = {
  "Suggested Answer": BookOpenCheck,
  "Better Phrase": Sparkles,
  "Use Material Point": FileText,
  "Ask a Discovery Question": Search,
  "Challenge Me": Target,
};

const cueGroups: Array<{
  cues: SmartCue[];
  description: string;
  title: string;
}> = [
  {
    title: "核心救场",
    description: "卡住时先拿到完整回答框架。",
    cues: ["Suggested Answer"],
  },
  {
    title: "优化表达",
    description: "分析你上一句话，并改成更自然得体的商务英文。",
    cues: ["Better Phrase"],
  },
  {
    title: "推进会谈",
    description: "围绕客户需求、材料证据和下一步继续推进。",
    cues: ["Ask a Discovery Question", "Use Material Point"],
  },
  {
    title: "进阶练习",
    description: "让客户追问得更尖锐，训练临场抗压。",
    cues: ["Challenge Me"],
  },
];

export type SmartGuidanceState = {
  currentJudgment: string;
  nextStep: string;
  riskNote?: string;
  sayThis: string;
};

export type SmartGuidanceStatus = "idle" | "loading" | "ready" | "error";

type SmartSupportPanelProps = {
  embedded?: boolean;
  guidance: SmartGuidanceState;
  guidanceError?: string | null;
  guidanceStatus?: SmartGuidanceStatus;
  onCue: (cue: SmartCue) => void;
};

export function SmartSupportPanel({
  embedded = false,
  guidance,
  guidanceError,
  guidanceStatus = "ready",
  onCue,
}: SmartSupportPanelProps) {
  const guidanceStatusView: Record<
    SmartGuidanceStatus,
    { label: string; tone: "neutral" | "success" | "warning" }
  > = {
    idle: { label: "待开始", tone: "neutral" },
    loading: { label: "分析中", tone: "warning" },
    ready: { label: "AI 分析", tone: "success" },
    error: { label: "待重试", tone: "warning" },
  };
  const currentGuidanceStatus = guidanceStatusView[guidanceStatus];
  const cueControls = (
    <div className="mt-4 grid gap-3">
      {cueGroups.map((group) => (
        <section key={group.title} className="rounded-md bg-white p-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {group.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {group.description}
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            {group.cues.map((cue) => {
              const Icon = cueIcons[cue];

              return (
                <button
                  key={cue}
                  type="button"
                  onClick={() => onCue(cue)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-left text-sm font-medium transition hover:border-[var(--primary)] hover:bg-[#f6fbfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  <Icon
                    className="h-4 w-4 shrink-0 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                  <span>{cueLabels[cue]}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  const smartGuidance = (
    <section
      aria-label="智能建议"
      aria-busy={guidanceStatus === "loading"}
      aria-live="polite"
      className="rounded-md border border-[#b7d8d6] bg-[#f6fbfa] p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareQuote
            className="h-4 w-4 text-[var(--primary)]"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            智能建议
          </h3>
        </div>
        <StatusPill tone={currentGuidanceStatus.tone}>
          {currentGuidanceStatus.label}
        </StatusPill>
      </div>

      <div className="mt-3 grid gap-2">
        {guidanceError ? (
          <p className="rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            {guidanceError}
          </p>
        ) : null}
        <div>
          <p className="text-xs font-semibold text-[var(--primary-strong)]">
            当前判断
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
            {guidance.currentJudgment}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--primary-strong)]">
            下一步
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
            {guidance.nextStep}
          </p>
        </div>
        <div className="rounded-md bg-white px-3 py-2">
          <p className="text-xs font-semibold text-[var(--primary-strong)]">
            可直接说
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-[var(--foreground)]">
            {guidance.sayThis}
          </p>
        </div>
        {guidance.riskNote ? (
          <p className="rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            {guidance.riskNote}
          </p>
        ) : null}
      </div>
    </section>
  );

  if (embedded) {
    return (
      <section className="rounded-md bg-[var(--surface-subtle)] p-4">
        <div className="mb-4 flex justify-end">
          <StatusPill tone="warning">可选</StatusPill>
        </div>
        {smartGuidance}
        {cueControls}
      </section>
    );
  }

  return (
    <aside
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">提示</h2>
        </div>
        <StatusPill tone="warning">可选</StatusPill>
      </div>

      <div className="mt-4">{smartGuidance}</div>
      {cueControls}
    </aside>
  );
}
