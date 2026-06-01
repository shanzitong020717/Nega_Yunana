import { Mic2, MicOff, PhoneOff } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

export type RealtimeRoomState =
  | "Ready"
  | "In Conversation"
  | "Muted"
  | "Reconnecting"
  | "Mic Permission Required"
  | "Connection Error"
  | "Session Ended";

type LiveMeetingPanelProps = {
  state: RealtimeRoomState;
  onStart: () => void;
  onMute: () => void;
  onEnd: () => void;
  isMuted: boolean;
  voicePackLabel?: string;
};

const primaryStateLabels: Record<RealtimeRoomState, string> = {
  Ready: "准备开始",
  "In Conversation": "对话中",
  Muted: "对话中",
  Reconnecting: "正在连接",
  "Mic Permission Required": "需要麦克风权限",
  "Connection Error": "连接失败",
  "Session Ended": "会话已结束",
};

function helperText(state: RealtimeRoomState, isMuted: boolean) {
  if (state === "Ready") {
    return "语音通道尚未开启。";
  }

  if (state === "Muted" || isMuted) {
    return "麦克风已静音";
  }

  if (state === "Reconnecting") {
    return "正在建立实时语音连接。";
  }

  if (state === "Mic Permission Required") {
    return "浏览器麦克风权限未开启。";
  }

  if (state === "Connection Error") {
    return "实时连接异常，请检查网络或语音服务配置。";
  }

  if (state === "Session Ended") {
    return "本次练习已结束，转写会用于后续复盘。";
  }

  return "语音通道已连接。";
}

function canControlLiveSession(state: RealtimeRoomState) {
  return (
    state === "In Conversation" ||
    state === "Muted" ||
    state === "Reconnecting"
  );
}

export function LiveMeetingPanel({
  state,
  onStart,
  onMute,
  onEnd,
  isMuted,
  voicePackLabel = "Kore 坚定专业",
}: LiveMeetingPanelProps) {
  const isLiveSession = canControlLiveSession(state);

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <p className="text-sm font-semibold text-[var(--muted)]">
              实时语音练习
            </p>
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {primaryStateLabels[state]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {helperText(state, isMuted)}
          </p>
          <p className="mt-2 text-xs font-medium text-[var(--primary-strong)]">
            AI 声音：{voicePackLabel}
          </p>
        </div>
        <StatusPill
          tone={
            state === "Connection Error"
              ? "danger"
              : state === "Session Ended"
                ? "neutral"
                : "primary"
          }
        >
          {primaryStateLabels[state]}
        </StatusPill>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {!isLiveSession ? (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
          >
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            开始
          </button>
        ) : null}
        {isLiveSession ? (
          <>
            <button
              type="button"
              onClick={onMute}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              <MicOff className="h-4 w-4" aria-hidden="true" />
              {isMuted ? "取消静音" : "静音"}
            </button>
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-4 text-sm font-medium text-[var(--danger)] transition hover:border-[var(--danger)]"
            >
              <PhoneOff className="h-4 w-4" aria-hidden="true" />
              结束并复盘
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
