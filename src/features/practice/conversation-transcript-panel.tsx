"use client";

import { ChevronUp, Languages } from "lucide-react";
import { useState } from "react";

export type TranscriptTurn = {
  id: string;
  speaker: "ai_customer" | "user" | "system";
  text: string;
  translationZh?: string;
  timestamp: number;
};

type ConversationTranscriptPanelProps = {
  turns: TranscriptTurn[];
};

function speakerLabel(speaker: TranscriptTurn["speaker"]) {
  if (speaker === "ai_customer") {
    return "AI 客户";
  }

  if (speaker === "user") {
    return "你";
  }

  return "系统";
}

function looksLikeMalformedTranslation(text: string) {
  return (
    text.startsWith("{") ||
    text.startsWith("[") ||
    /["“]?translationZh["”]?\s*:/.test(text)
  );
}

function turnTranslation(turn: TranscriptTurn) {
  const translation = turn.translationZh?.trim();

  if (!translation || looksLikeMalformedTranslation(translation)) {
    return undefined;
  }

  return translation;
}

export function ConversationTranscriptPanel({
  turns,
}: ConversationTranscriptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const conversationTurns = turns.filter((turn) => turn.speaker !== "system");
  const visibleTurns = conversationTurns.slice(-3);

  if (!isExpanded) {
    return (
      <button
        type="button"
        aria-expanded={false}
        aria-controls="complete-transcript-panel"
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--primary)] hover:bg-[#f6fbfa]"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <span className="text-base font-semibold text-[var(--foreground)]">
              实时字幕
            </span>
          </span>
          <span className="text-xs text-[var(--muted)]">最近 3 轮</span>
        </span>
        <span className="mt-3 block space-y-2">
          {visibleTurns.map((turn) => (
            <span
              key={turn.id}
              className="block rounded-md bg-[var(--surface-subtle)] px-3 py-2"
            >
              <span className="block text-xs font-semibold text-[var(--primary-strong)]">
                {speakerLabel(turn.speaker)}
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--foreground)]">
                {turn.text}
              </span>
            </span>
          ))}
        </span>
      </button>
    );
  }

  return (
    <section
      id="complete-transcript-panel"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            完整字幕
          </h2>
          <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
            最近 3 轮
          </span>
        </div>
        <button
          type="button"
          aria-expanded={true}
          aria-controls="complete-transcript-panel"
          onClick={() => setIsExpanded(false)}
          className="inline-flex min-h-11 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
          折叠
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {visibleTurns.map((turn) => {
          const translation = turnTranslation(turn);

          return (
            <article
              key={turn.id}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3"
            >
              <p className="text-xs font-semibold text-[var(--primary-strong)]">
                {speakerLabel(turn.speaker)}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                {turn.text}
              </p>
              {translation ? (
                <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                  {translation}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
