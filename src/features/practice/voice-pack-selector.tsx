"use client";

import { Volume2 } from "lucide-react";

import type { VoicePack } from "@/data/scenario-packs";

type VoicePackSelectorProps = {
  voicePacks: VoicePack[];
  selectedVoicePackId: string;
  onSelect: (voicePackId: string) => void;
};

const speedLabels: Record<VoicePack["speed"], string> = {
  medium_slow: "中等偏慢",
  medium: "中等",
  medium_fast: "中等偏快",
  fast: "偏快",
};

export function VoicePackSelector({
  voicePacks,
  selectedVoicePackId,
  onSelect,
}: VoicePackSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {voicePacks.map((voicePack) => {
        const isSelected = selectedVoicePackId === voicePack.id;

        return (
          <button
            key={voicePack.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(voicePack.id)}
            className={[
              "min-h-44 rounded-md border bg-[var(--surface)] p-4 text-left transition",
              isSelected
                ? "border-[var(--primary)] bg-[#e7f4f2]"
                : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#f6fbfa]",
            ].join(" ")}
          >
            <span className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-subtle)] text-[var(--primary)]">
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--foreground)]">
                  {voicePack.name}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {voicePack.gender === "female" ? "女声" : "男声"} ·{" "}
                  {speedLabels[voicePack.speed]}
                </span>
              </span>
            </span>
            <span className="mt-3 block text-sm leading-6 text-[var(--foreground)]">
              {voicePack.personality}
            </span>
            <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
              {voicePack.voiceStyle}
            </span>
            <span className="mt-3 block text-xs text-[var(--muted)]">
              适合：{voicePack.bestFor.join("、")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
