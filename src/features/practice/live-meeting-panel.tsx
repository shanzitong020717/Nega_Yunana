import { Mic2, MicOff, PhoneOff } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

export type RealtimeRoomState =
  | "Ready"
  | "Listening"
  | "Thinking"
  | "Speaking"
  | "Muted"
  | "Reconnecting"
  | "Mic Permission Required"
  | "Session Ended";

export type TranscriptTurn = {
  id: string;
  speaker: "user" | "ai_customer" | "system";
  text: string;
  timestamp: number;
};

type LiveMeetingPanelProps = {
  state: RealtimeRoomState;
  transcriptTurns: TranscriptTurn[];
  onStart: () => void;
  onMute: () => void;
  onEnd: () => void;
  isMuted: boolean;
};

const allStates: RealtimeRoomState[] = [
  "Ready",
  "Listening",
  "Thinking",
  "Speaking",
  "Muted",
  "Reconnecting",
  "Mic Permission Required",
  "Session Ended",
];

function speakerLabel(speaker: TranscriptTurn["speaker"]) {
  if (speaker === "ai_customer") {
    return "AI Customer";
  }

  if (speaker === "user") {
    return "You";
  }

  return "System";
}

export function LiveMeetingPanel({
  state,
  transcriptTurns,
  onStart,
  onMute,
  onEnd,
  isMuted,
}: LiveMeetingPanelProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Live meeting panel</h2>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--primary-strong)]">
            Current state: {state}
          </p>
        </div>
        <StatusPill tone={state === "Session Ended" ? "neutral" : "primary"}>
          {state}
        </StatusPill>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {allStates.map((item) => (
          <span
            key={item}
            className={[
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              item === state
                ? "border-[#b7d8d6] bg-[#e7f4f2] text-[var(--primary-strong)]"
                : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)]",
            ].join(" ")}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
        >
          <Mic2 className="h-4 w-4" aria-hidden="true" />
          Start
        </button>
        <button
          type="button"
          onClick={onMute}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--primary)]"
        >
          <MicOff className="h-4 w-4" aria-hidden="true" />
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-4 text-sm font-medium text-[var(--danger)] transition hover:border-[var(--danger)]"
        >
          <PhoneOff className="h-4 w-4" aria-hidden="true" />
          End
        </button>
      </div>

      <div className="mt-5 max-h-[30rem] overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
        <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">
          Transcript
        </h3>
        <div className="mt-3 space-y-3">
          {transcriptTurns.map((turn) => (
            <article
              key={turn.id}
              className="rounded-md border border-[var(--border)] bg-white p-3"
            >
              <p className="text-xs font-semibold text-[var(--primary-strong)]">
                {speakerLabel(turn.speaker)}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {turn.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
