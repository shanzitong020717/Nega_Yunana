"use client";

import { BookOpenCheck, Lightbulb, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { personas as legacyPersonas } from "@/data/personas";
import { defaultScenarioPack } from "@/data/scenario-packs";
import {
  ConversationTranscriptPanel,
  type TranscriptTurn,
} from "@/features/practice/conversation-transcript-panel";
import {
  LiveMeetingPanel,
  type RealtimeRoomState,
} from "@/features/practice/live-meeting-panel";
import {
  SmartSupportPanel,
  type SmartCue,
  type SmartGuidanceState,
} from "@/features/practice/smart-support-panel";
import {
  SupportResultWorkspace,
  type SupportResultTabType,
  type SupportResultTabView,
} from "@/features/practice/support-result-workspace";
import {
  decodePCM16Base64ToFloat32,
  encodeFloat32AudioToPCM16Base64,
} from "@/lib/audio/pcm";
import {
  readPracticeSessionSelection,
  type StoredPracticeSessionSelection,
} from "@/lib/practice/practice-session-selection";
import {
  completeTodayRecommendationAndPrefetch,
} from "@/lib/recommendations/today-recommendation-cache";
import type { SuggestedAnswerRecord } from "@/lib/validation/suggested-answer";

type RealtimeRoomProps = {
  initialPracticeSession?: StoredPracticeSessionSelection | null;
  initialTranscriptTurns?: TranscriptTurn[];
  sessionId: string;
};

type BrowserAudioContextConstructor = typeof AudioContext;

type RealtimeWebRTCSessionResponse = {
  transport?: "webrtc";
  clientSecret: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

type RealtimeRelaySessionResponse = {
  transport: "websocket_relay";
  relayUrl: string;
  relayToken: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  voiceName?: string;
  inputAudioSampleRate?: number;
  outputAudioSampleRate?: number;
  instructionsPreview: string;
};

type RealtimeSessionResponse =
  | RealtimeWebRTCSessionResponse
  | RealtimeRelaySessionResponse;

type SubtitleTranslationResponse = {
  translationZh?: string;
};

type SuggestedAnswerResponse = {
  suggestion?: SuggestedAnswerRecord;
};

type SupportCueResponse = {
  cueResult?: SupportCueResult;
};

type SmartGuidanceResponse = {
  guidance?: SmartGuidanceState;
};

type SupportCue = Exclude<SmartCue, "Suggested Answer">;

type SupportCueResultSection = {
  label: string;
  english?: string;
  chinese?: string;
  note?: string;
};

type SupportCueVocabularyItem = {
  term: string;
  phonetic: string;
  chinese: string;
  example: string;
};

type SupportCueResult = {
  id: string;
  title: string;
  badge: string;
  sections: SupportCueResultSection[];
  vocabulary?: SupportCueVocabularyItem[];
};

type SupportResultTab = SupportResultTabView & {
  payload?: SuggestedAnswerRecord | SupportCueResult;
};

type SupportCueResultTabType = Exclude<
  SupportResultTabType,
  "suggested-answer"
>;

const supportCueNotices: Record<SupportCue, string> = {
  "Better Phrase": "更自然表达分析已生成。",
  "Use Material Point": "材料要点建议已生成。",
  "Ask a Discovery Question": "探索问题建议已生成。",
  "Challenge Me": "挑战练习建议已生成。",
};

const cueToSupportResultTabType = {
  "Better Phrase": "better-phrase",
  "Use Material Point": "material-point",
  "Ask a Discovery Question": "discovery-question",
  "Challenge Me": "challenge-me",
} satisfies Record<SupportCue, SupportCueResultTabType>;

const supportResultTabTypeToCue = {
  "better-phrase": "Better Phrase",
  "material-point": "Use Material Point",
  "discovery-question": "Ask a Discovery Question",
  "challenge-me": "Challenge Me",
} satisfies Record<SupportCueResultTabType, SupportCue>;

const supportResultTabTitles = {
  "suggested-answer": "建议回答",
  "better-phrase": "更自然表达",
  "discovery-question": "探索问题",
  "material-point": "材料要点",
  "challenge-me": "挑战我",
} satisfies Record<SupportResultTabType, string>;

function supportResultTabId(type: SupportResultTabType) {
  return `support-result-${type}`;
}

const recommendedPhraseSectionLabelKeys = new Set([
  "推荐说法",
  "更自然表达",
  "改进后句子",
  "改进后的建议",
  "优化建议",
  "改进建议",
  "Recommended improved sentence",
  "Improved sentence",
  "Recommendation",
].map(normalizeSupportCueLabelKey));

const analysisSectionLabelKeys = new Set([
  "analysis",
  "原文分析",
  "原句分析",
  "你的原句",
  "当前句子分析",
  "current sentence analysis",
].map(normalizeSupportCueLabelKey));

function normalizeSupportCueLabelKey(label: string) {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

function isBetterPhraseResult(result: SupportCueResult) {
  const titleAndBadge = normalizeSupportCueLabelKey(
    `${result.title} ${result.badge}`,
  );

  return (
    titleAndBadge.includes("better phrase") ||
    titleAndBadge.includes("更自然") ||
    titleAndBadge.includes("表达优化") ||
    titleAndBadge.includes("句子优化")
  );
}

function supportCueSectionDisplayLabel(section: SupportCueResultSection) {
  const labelKey = normalizeSupportCueLabelKey(section.label);

  if (recommendedPhraseSectionLabelKeys.has(labelKey)) {
    return "改进后句子";
  }

  if (analysisSectionLabelKeys.has(labelKey)) {
    return "原句分析";
  }

  return section.label;
}

function isRecommendedPhraseSection(section: SupportCueResultSection) {
  return (
    supportCueSectionDisplayLabel(section) === "改进后句子"
  );
}

function supportCueLabelIncludes(
  section: SupportCueResultSection,
  labels: string[],
) {
  const labelKey = normalizeSupportCueLabelKey(section.label);

  return labels.some((label) =>
    labelKey.includes(normalizeSupportCueLabelKey(label)),
  );
}

function findSupportCueSection(
  sections: SupportCueResultSection[],
  labels: string[],
) {
  return sections.find((section) => supportCueLabelIncludes(section, labels));
}

function firstSpeakableSupportCueSection(sections: SupportCueResultSection[]) {
  return sections.find((section) => section.english?.trim());
}

function sectionHasVisibleContent(section?: SupportCueResultSection) {
  return Boolean(
    section?.english?.trim() || section?.chinese?.trim() || section?.note?.trim(),
  );
}

function isDiscoveryQuestionResult(result: SupportCueResult) {
  const normalizedTitle = normalizeSupportCueLabelKey(
    `${result.title} ${result.badge}`,
  );

  return (
    normalizedTitle.includes("探索") ||
    normalizedTitle.includes("discovery") ||
    Boolean(
      findSupportCueSection(result.sections, [
        "推荐问题",
        "探索问题",
        "建议问题",
        "下一句可以问",
        "recommended question",
      ]),
    )
  );
}

function isMaterialPointResult(result: SupportCueResult) {
  const normalizedTitle = normalizeSupportCueLabelKey(
    `${result.title} ${result.badge}`,
  );

  return (
    normalizedTitle.includes("材料") ||
    normalizedTitle.includes("material") ||
    Boolean(
      findSupportCueSection(result.sections, [
        "可引用要点",
        "材料要点",
        "材料证据",
        "现在最适合引用",
        "material point",
      ]),
    )
  );
}

const DEFAULT_INPUT_AUDIO_SAMPLE_RATE = 24_000;
const DEFAULT_OUTPUT_AUDIO_SAMPLE_RATE = 24_000;
const INPUT_AUDIO_BUFFER_SIZE = 4096;
const RELAY_READY_TIMEOUT_MS = 45_000;
const DEFAULT_PERSONA_ID = "technical_lead";
const DEFAULT_VOICE_PACK_ID = "kore-firm";

const legacyVoicePackIds: Record<string, string> = {
  "ava-friendly-buyer": "zephyr-bright",
  "serena-enterprise-decision-maker": "kore-firm",
  "ethan-technical-lead": "charon-informative",
  "marcus-executive-customer": "fenrir-excitable",
  "vivian-critical-procurement": "leda-youthful",
  "noah-channel-partner": "puck-upbeat",
};

function defaultPracticeSessionSelection(
  sessionId: string,
): StoredPracticeSessionSelection {
  return {
    id: sessionId,
    scenarioPackId: defaultScenarioPack.id,
    goalId: "customer_qa",
    mode: "customer_qa",
    personaId: DEFAULT_PERSONA_ID,
    voicePackId: DEFAULT_VOICE_PACK_ID,
    difficulty: "normal",
    trainingFocus: ["business value", "privacy objection"],
    focusTags: ["商业价值", "隐私安全"],
  };
}

function normalizePracticeSessionSelection(
  sessionId: string,
  practiceSession?: StoredPracticeSessionSelection | null,
) {
  const fallback = defaultPracticeSessionSelection(sessionId);

  if (!practiceSession) {
    return fallback;
  }

  return {
    ...fallback,
    ...practiceSession,
    id: practiceSession.id || sessionId,
    trainingFocus:
      practiceSession.trainingFocus.length > 0
        ? practiceSession.trainingFocus
        : fallback.trainingFocus,
    focusTags:
      practiceSession.focusTags.length > 0
        ? practiceSession.focusTags
        : fallback.focusTags,
  };
}

function resolveVoicePackLabel(voicePackId: string) {
  const normalizedVoicePackId = legacyVoicePackIds[voicePackId] ?? voicePackId;

  return (
    defaultScenarioPack.voicePacks.find(
      (voicePack) => voicePack.id === normalizedVoicePackId,
    )?.name ??
    defaultScenarioPack.voicePacks.find(
      (voicePack) => voicePack.id === DEFAULT_VOICE_PACK_ID,
    )?.name ??
    "Kore 坚定专业"
  );
}

function resolveVoicePackGender(voicePackId: string) {
  const normalizedVoicePackId = legacyVoicePackIds[voicePackId] ?? voicePackId;

  return defaultScenarioPack.voicePacks.find(
    (voicePack) => voicePack.id === normalizedVoicePackId,
  )?.gender;
}

function resolvePersonaLabel(personaId: string) {
  return (
    defaultScenarioPack.personas.find((persona) => persona.id === personaId)
      ?.label ??
    legacyPersonas.find((persona) => persona.id === personaId)?.name ??
    "技术负责人"
  );
}

function buildStartRoleplayInstructions(
  practiceSession: StoredPracticeSessionSelection,
) {
  const personaLabel = resolvePersonaLabel(practiceSession.personaId);
  const voicePackLabel = resolveVoicePackLabel(practiceSession.voicePackId);
  const voicePackGender = resolveVoicePackGender(practiceSession.voicePackId);

  return [
    `Start the roleplay as the selected AI customer persona: ${personaLabel}.`,
    `Use the selected voice pack and speaking style: ${voicePackLabel}.`,
    voicePackGender
      ? `The spoken AI voice must sound clearly ${voicePackGender}.`
      : "Use the selected provider voice.",
    "Do not introduce yourself using any unselected voice persona name.",
    "Ask one concise customer discovery question about Rokid smart glasses in an overseas business meeting.",
  ].join(" ");
}

function nextTurnId() {
  return `turn_${crypto.randomUUID()}`;
}

function isMockRealtimeCredential(clientSecret: string) {
  return clientSecret.startsWith("mock_realtime_client_secret_");
}

function isRelayRealtimeCredential(
  realtimeSession: RealtimeSessionResponse,
): realtimeSession is RealtimeRelaySessionResponse {
  return realtimeSession.transport === "websocket_relay";
}

function getBrowserAudioContext() {
  const browserGlobal = globalThis as typeof globalThis & {
    webkitAudioContext?: BrowserAudioContextConstructor;
  };

  return browserGlobal.AudioContext ?? browserGlobal.webkitAudioContext;
}

function eventText(event: Record<string, unknown>) {
  const transcript = event.transcript;
  const text = event.text;

  if (typeof transcript === "string") {
    return transcript.trim();
  }

  if (typeof text === "string") {
    return text.trim();
  }

  return "";
}

function realtimeErrorMessage(event: Record<string, unknown>) {
  const error = event.error;
  const message = event.message;

  if (error && typeof error === "object") {
    const nestedMessage = (error as Record<string, unknown>).message;

    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage.trim();
    }
  }

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return "实时模型服务返回错误，请检查第三方 Realtime API 配置。";
}

function userFacingRealtimeError(message: string) {
  const trimmedMessage = message.trim();
  const lowerMessage = trimmedMessage.toLowerCase();

  if (
    lowerMessage.includes("provider") ||
    lowerMessage.includes("handshake") ||
    lowerMessage.includes("api") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden")
  ) {
    return "实时模型连接失败，请检查 Realtime API 配置。";
  }

  return /[\u4e00-\u9fa5]/.test(trimmedMessage)
    ? trimmedMessage
    : "实时连接异常，请稍后重试。";
}

function latestConversationTurn(turns: TranscriptTurn[]) {
  return [...turns].reverse().find((turn) => turn.speaker !== "system");
}

function buildSmartGuidance(turns: TranscriptTurn[]): SmartGuidanceState {
  const latestTurn = latestConversationTurn(turns);

  if (!latestTurn) {
    return {
      currentJudgment: "还没有真实对话内容，开始后会根据客户和你的发言生成智能建议。",
      nextStep: "先进入对话，听清客户的第一轮关注点，再让 AI 给出下一步引导。",
      sayThis:
        "Could you share the main situation where your team would use smart glasses?",
    };
  }

  const latestSpeaker = latestTurn.speaker === "ai_customer" ? "客户" : "你";

  return {
    currentJudgment: `正在根据${latestSpeaker}刚才的真实发言生成智能建议。`,
    nextStep: "先保持对话节奏，等 AI 分析返回后再按照当前语境选择下一步。",
    sayThis:
      "Let me make sure I understand your point before I answer.",
  };
}

function SuggestedAnswerPanel({
  errorMessage,
  isLoading,
  suggestion,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  suggestion: SuggestedAnswerRecord | null;
}) {
  if (isLoading) {
    return (
      <section
        aria-live="polite"
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div className="flex items-center gap-2">
          <Loader2
            className="h-5 w-5 animate-spin text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            核心救场
          </h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          正在结合当前情境、客户角色和最近问题生成建议回答。
        </p>
      </section>
    );
  }

  if (!suggestion) {
    return errorMessage ? (
      <section
        role="status"
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          核心救场
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {errorMessage}
        </p>
      </section>
    ) : null;
  }

  const [primaryReply, ...alternativeReplies] = suggestion.suggestedReplies;
  const contextItems = [
    ["当前对话", suggestion.contextBreakdown.conversationStateZh],
    [
      "客户为什么现在问",
      suggestion.contextBreakdown.customerQuestionReasonZh,
    ],
    ["前文回答", suggestion.contextBreakdown.priorUserAnswerZh],
    ["当前缺口", suggestion.contextBreakdown.missingInformationZh],
    ["回答边界", suggestion.contextBreakdown.responseBoundaryZh],
  ];
  const logicItems = [
    ["表层语义", suggestion.logicBreakdown.surfaceMeaningZh],
    ["客户目的", suggestion.logicBreakdown.customerIntentZh],
    ["想确认的信息", suggestion.logicBreakdown.informationNeededZh],
    ["回应重点", suggestion.logicBreakdown.responseFocusZh],
  ];

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck
            className="h-5 w-5 text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            核心救场
          </h2>
        </div>
        <span className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]">
          已记录到表达库和复盘
        </span>
      </div>

      {primaryReply ? (
        <article
          aria-label="直接这样回答"
          className="mt-4 rounded-md border border-[#b7d8d6] bg-[#f6fbfa] p-4"
        >
          <p className="text-sm font-semibold text-[var(--primary-strong)]">
            直接这样回答
          </p>
          <p className="mt-3 text-base font-semibold leading-7 text-[var(--foreground)]">
            {primaryReply.english}
          </p>
          <p className="mt-3 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
            {primaryReply.chinese}
          </p>
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-[var(--muted)]">
            {primaryReply.reason}
          </p>
        </article>
      ) : null}

      {alternativeReplies.length > 0 ? (
        <section className="mt-3 rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            备用说法
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {alternativeReplies.map((reply, index) => (
              <article
                key={reply.english}
                className="rounded-md bg-[var(--surface-subtle)] px-3 py-2"
              >
                <p className="text-xs font-semibold text-[var(--primary-strong)]">
                  备选 {index + 1}
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-[var(--foreground)]">
                  {reply.english}
                </p>
                <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                  {reply.chinese}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {reply.reason}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            客户刚才问什么
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
            {suggestion.aiQuestion.english}
          </p>
          <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
            {suggestion.aiQuestion.translationZh}
          </p>
        </article>

        <article className="rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            回应策略
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
            {suggestion.responseStrategy.english}
          </p>
          <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
            {suggestion.responseStrategy.chinese}
          </p>
        </article>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            上下文解析
          </p>
          <div className="mt-3 grid gap-2">
            {contextItems.map(([label, content]) => (
              <div
                key={label}
                className="rounded-md bg-[var(--surface-subtle)] px-3 py-2"
              >
                <p className="text-xs font-semibold text-[var(--primary-strong)]">
                  {label}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {content}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            语句逻辑拆解
          </p>
          <div className="mt-3 grid gap-2">
            {logicItems.map(([label, content]) => (
              <div
                key={label}
                className="rounded-md bg-[var(--surface-subtle)] px-3 py-2"
              >
                <p className="text-xs font-semibold text-[var(--primary-strong)]">
                  {label}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {content}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      {suggestion.analysis ? (
        <p className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
          {suggestion.analysis}
        </p>
      ) : null}

      {suggestion.vocabulary.length > 0 ? (
        <div className="mt-3 rounded-md border border-[var(--border)] p-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            高级词汇
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {suggestion.vocabulary.map((item) => (
              <div
                key={`${item.term}-${item.phonetic}`}
                className="rounded-md bg-[var(--surface-subtle)] p-3"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.term}
                </p>
                <p className="mt-1 text-sm text-[var(--primary-strong)]">
                  {item.phonetic}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {item.chinese}
                </p>
                {item.example ? (
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {item.example}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SupportCueVocabularyBlock({
  result,
}: {
  result: Pick<SupportCueResult, "id" | "vocabulary">;
}) {
  if (!result.vocabulary || result.vocabulary.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-md border border-[var(--border)] p-3">
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
        高级词汇
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {result.vocabulary.map((item) => (
          <div
            key={`${result.id}-${item.term}`}
            className="rounded-md bg-[var(--surface-subtle)] p-3"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {item.term}
            </p>
            <p className="mt-1 text-sm text-[var(--primary-strong)]">
              {item.phonetic}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {item.chinese}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {item.example}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BetterPhraseResultPanel({
  errorMessage,
  isLoading,
  result,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  result: SupportCueResult;
}) {
  const orderedSections = [...result.sections].sort((left, right) => {
    const leftLabel = supportCueSectionDisplayLabel(left);
    const rightLabel = supportCueSectionDisplayLabel(right);
    const rank = (label: string) =>
      label === "原句分析" ? 0 : label === "改进后句子" ? 1 : 2;

    return rank(leftLabel) - rank(rightLabel);
  });

  return (
    <section
      aria-live="polite"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck
            className="h-5 w-5 text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            更自然表达分析
          </h2>
        </div>
        <span className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]">
          {isLoading ? "AI 生成中" : "表达优化"}
        </span>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {orderedSections.map((section) => {
          const displayLabel = supportCueSectionDisplayLabel(section);
          const isImproved = displayLabel === "改进后句子";

          return (
            <article
              key={`${result.id}-${section.label}`}
              className={[
                "rounded-md border p-3 md:col-span-2",
                isImproved
                  ? "border-[#b7d8d6] bg-[#f6fbfa]"
                  : "border-[var(--border)] bg-[var(--surface-subtle)]",
              ].join(" ")}
            >
              <p className="text-xs font-semibold text-[var(--muted)]">
                {displayLabel}
              </p>
              {section.english ? (
                <p
                  className={[
                    "mt-2 text-sm leading-6 text-[var(--foreground)]",
                    isImproved ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {section.english}
                </p>
              ) : null}
              {section.chinese ? (
                <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                  {section.chinese}
                </p>
              ) : null}
              {section.note ? (
                <p className="mt-2 rounded-md bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
                  {section.note}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <SupportCueVocabularyBlock result={result} />
    </section>
  );
}

function SupportCuePrimaryActionCard({
  label,
  section,
}: {
  label: string;
  section: SupportCueResultSection;
}) {
  return (
    <article
      aria-label={label}
      className="mt-4 rounded-md border border-[#b7d8d6] bg-[#f6fbfa] p-4"
    >
      <p className="text-sm font-semibold text-[var(--primary-strong)]">
        {label}
      </p>
      {section.english ? (
        <p className="mt-3 text-base font-semibold leading-7 text-[var(--foreground)]">
          {section.english}
        </p>
      ) : null}
      {section.chinese ? (
        <p className="mt-3 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
          {section.chinese}
        </p>
      ) : null}
      {section.note ? (
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-[var(--muted)]">
          {section.note}
        </p>
      ) : null}
    </article>
  );
}

function SupportCueInfoBlock({
  label,
  section,
}: {
  label: string;
  section?: SupportCueResultSection;
}) {
  if (!sectionHasVisibleContent(section)) {
    return null;
  }

  return (
    <article className="rounded-md bg-white p-3">
      <p className="text-xs font-semibold text-[var(--primary-strong)]">
        {label}
      </p>
      {section?.english ? (
        <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
          {section.english}
        </p>
      ) : null}
      {section?.chinese ? (
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {section.chinese}
        </p>
      ) : null}
      {section?.note ? (
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {section.note}
        </p>
      ) : null}
    </article>
  );
}

function SupportCueSafetyNote({
  label = "不要越界",
  section,
}: {
  label?: string;
  section?: SupportCueResultSection;
}) {
  if (!sectionHasVisibleContent(section)) {
    return null;
  }

  return (
    <article className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2">
      <p className="text-xs font-semibold text-[#8a5a05]">{label}</p>
      {section?.english ? (
        <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
          {section.english}
        </p>
      ) : null}
      {section?.chinese ? (
        <p className="mt-2 text-sm leading-6 text-[#8a5a05]">
          {section.chinese}
        </p>
      ) : null}
      {section?.note ? (
        <p className="mt-2 text-sm leading-6 text-[#8a5a05]">
          {section.note}
        </p>
      ) : null}
    </article>
  );
}

function SupportCueActionHeader({
  badge,
  isLoading,
  subtitle,
  title,
}: {
  badge: string;
  isLoading: boolean;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <BookOpenCheck
            className="h-5 w-5 text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {subtitle}
        </p>
      </div>
      <span className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]">
        {isLoading ? "AI 生成中" : badge}
      </span>
    </div>
  );
}

function DiscoveryQuestionResultPanel({
  errorMessage,
  isLoading,
  result,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  result: SupportCueResult;
}) {
  const primarySection =
    findSupportCueSection(result.sections, [
      "推荐问题",
      "探索问题",
      "建议问题",
      "下一句可以问",
      "recommended question",
    ]) ?? firstSpeakableSupportCueSection(result.sections);
  const reasonSection = findSupportCueSection(result.sections, [
    "建议原因",
    "为什么",
    "why",
  ]);
  const intentSection = findSupportCueSection(result.sections, [
    "客户意图",
    "AI 客户上下文",
    "客户上下文",
    "customer intent",
    "context",
  ]);
  const followUpSection = findSupportCueSection(result.sections, [
    "后续判断",
    "下一步",
    "问完看什么",
    "follow-up",
    "signal",
  ]);
  const safetySection = findSupportCueSection(result.sections, [
    "风险边界",
    "不要越界",
    "boundary",
    "risk",
  ]);

  return (
    <section
      aria-live="polite"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <SupportCueActionHeader
        badge={result.badge}
        isLoading={isLoading}
        subtitle="先问出客户真实目标，再决定该讲价值、材料还是下一步。"
        title="探索问题建议"
      />

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
          {errorMessage}
        </p>
      ) : null}

      {primarySection ? (
        <SupportCuePrimaryActionCard
          label="下一句可以问"
          section={primarySection}
        />
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <SupportCueInfoBlock label="为什么这样问" section={reasonSection} />
        <SupportCueInfoBlock label="客户意图" section={intentSection} />
        <SupportCueInfoBlock label="问完看什么" section={followUpSection} />
      </div>

      <SupportCueSafetyNote label="注意边界" section={safetySection} />
      <SupportCueVocabularyBlock result={result} />
    </section>
  );
}

function MaterialPointResultPanel({
  errorMessage,
  isLoading,
  result,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  result: SupportCueResult;
}) {
  const primarySection =
    findSupportCueSection(result.sections, [
      "可引用要点",
      "材料要点",
      "材料证据",
      "现在最适合引用",
      "material point",
    ]) ?? firstSpeakableSupportCueSection(result.sections);
  const usageSection = findSupportCueSection(result.sections, [
    "使用方式",
    "推荐说法",
    "怎么接上话",
    "how to use",
  ]);
  const basisSection = findSupportCueSection(result.sections, [
    "材料依据",
    "材料证据",
    "AI 客户上下文",
    "客户上下文",
    "source",
  ]);
  const boundarySection = findSupportCueSection(result.sections, [
    "风险边界",
    "不要越界",
    "boundary",
    "risk",
  ]);

  return (
    <section
      aria-live="polite"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <SupportCueActionHeader
        badge={result.badge}
        isLoading={isLoading}
        subtitle="只引用材料和上下文支持的内容，把未确认信息留给后续确认。"
        title="材料要点建议"
      />

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
          {errorMessage}
        </p>
      ) : null}

      {primarySection ? (
        <SupportCuePrimaryActionCard
          label="现在最适合引用"
          section={primarySection}
        />
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SupportCueInfoBlock label="怎么接上话" section={usageSection} />
        <SupportCueInfoBlock label="材料依据" section={basisSection} />
      </div>

      <SupportCueSafetyNote label="不要越界" section={boundarySection} />
      <SupportCueVocabularyBlock result={result} />
    </section>
  );
}

function SupportCueResultPanel({
  errorMessage,
  isLoading,
  result,
}: {
  errorMessage: string | null;
  isLoading: boolean;
  result: SupportCueResult | null;
}) {
  if (!result) {
    return isLoading ? (
      <section
        aria-live="polite"
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div className="flex items-center gap-2">
          <Loader2
            className="h-5 w-5 animate-spin text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            正在生成提示分析
          </h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          正在结合上下文、客户身份和商务表达规范生成建议。
        </p>
      </section>
    ) : null;
  }

  if (isBetterPhraseResult(result)) {
    return (
      <BetterPhraseResultPanel
        errorMessage={errorMessage}
        isLoading={isLoading}
        result={result}
      />
    );
  }

  if (isDiscoveryQuestionResult(result)) {
    return (
      <DiscoveryQuestionResultPanel
        errorMessage={errorMessage}
        isLoading={isLoading}
        result={result}
      />
    );
  }

  if (isMaterialPointResult(result)) {
    return (
      <MaterialPointResultPanel
        errorMessage={errorMessage}
        isLoading={isLoading}
        result={result}
      />
    );
  }

  return (
    <section
      aria-live="polite"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck
            className="h-5 w-5 text-[var(--primary)]"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {result.title}
          </h2>
        </div>
        <span className="rounded-md border border-[#b7d8d6] bg-[#e7f4f2] px-2.5 py-1 text-xs font-medium text-[var(--primary-strong)]">
          {isLoading ? "AI 生成中" : result.badge}
        </span>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-[#f4d39a] bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {result.sections.map((section) => (
          <article
            key={`${result.id}-${section.label}`}
            className={[
              "rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3",
              isRecommendedPhraseSection(section) ? "md:col-span-2" : "",
            ].join(" ")}
          >
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              {supportCueSectionDisplayLabel(section)}
            </p>
            {section.english ? (
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
                {section.english}
              </p>
            ) : null}
            {section.chinese ? (
              <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                {section.chinese}
              </p>
            ) : null}
            {section.note ? (
              <p className="mt-2 rounded-md bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-[#8a5a05]">
                {section.note}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <SupportCueVocabularyBlock result={result} />
    </section>
  );
}

export function RealtimeRoom({
  initialPracticeSession,
  initialTranscriptTurns = [],
  sessionId,
}: RealtimeRoomProps) {
  const [state, setState] = useState<RealtimeRoomState>("Ready");
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>(
    initialTranscriptTurns,
  );
  const [practiceSessionSelection, setPracticeSessionSelection] = useState(() =>
    normalizePracticeSessionSelection(sessionId, initialPracticeSession),
  );
  const [aiSmartGuidance, setAiSmartGuidance] = useState<{
    guidance: SmartGuidanceState;
    key: string;
  } | null>(null);
  const [smartGuidanceError, setSmartGuidanceError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [supportResultTabs, setSupportResultTabs] = useState<
    SupportResultTab[]
  >([]);
  const [activeSupportResultTabId, setActiveSupportResultTabId] = useState<
    string | null
  >(null);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const relayInputAudioContextRef = useRef<AudioContext | null>(null);
  const relayInputAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(
    null,
  );
  const relayInputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const relayOutputAudioContextRef = useRef<AudioContext | null>(null);
  const relayOutputTimeRef = useRef(0);
  const relaySocketRef = useRef<WebSocket | null>(null);
  const isMutedRef = useRef(false);
  const pendingAITranscriptRef = useRef("");
  const practiceSessionSelectionRef = useRef(practiceSessionSelection);
  const transcriptTurnsRef = useRef<TranscriptTurn[]>(initialTranscriptTurns);
  const smartGuidanceTranscriptPayload = transcriptTurns
    .filter((turn) => turn.speaker !== "system")
    .map((turn) => ({
      speaker: turn.speaker,
      text: turn.text,
      timestamp: turn.timestamp,
      metadata: {},
    }));
  const smartGuidanceRequestBody = JSON.stringify({
    practiceSession: practiceSessionSelection,
    transcriptTurns: smartGuidanceTranscriptPayload,
  });
  const hasSmartGuidanceTranscript = smartGuidanceTranscriptPayload.length > 0;
  const fallbackSmartGuidance = buildSmartGuidance(transcriptTurns);
  const hasCurrentAiSmartGuidance =
    aiSmartGuidance?.key === smartGuidanceRequestBody;
  const currentSmartGuidanceError =
    smartGuidanceError?.key === smartGuidanceRequestBody
      ? smartGuidanceError.message
      : null;
  const smartGuidance =
    hasCurrentAiSmartGuidance
      ? aiSmartGuidance.guidance
      : fallbackSmartGuidance;
  const smartGuidanceStatus = !hasSmartGuidanceTranscript
    ? "idle"
    : hasCurrentAiSmartGuidance
      ? "ready"
      : currentSmartGuidanceError
        ? "error"
        : "loading";

  useEffect(() => {
    return () => {
      closeRealtimeConnection();
    };
  }, []);

  useEffect(() => {
    practiceSessionSelectionRef.current = practiceSessionSelection;
  }, [practiceSessionSelection]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    if (!hasSmartGuidanceTranscript) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/practice-sessions/${sessionId}/smart-guidance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: smartGuidanceRequestBody,
      })
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }

          return (await response.json()) as SmartGuidanceResponse;
        })
        .then((payload) => {
          if (payload?.guidance) {
            setAiSmartGuidance({
              guidance: payload.guidance,
              key: smartGuidanceRequestBody,
            });
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          console.warn("Smart guidance request failed.", error);
          setSmartGuidanceError({
            key: smartGuidanceRequestBody,
            message: "智能建议暂时无法生成，请稍后重试。",
          });
        });
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hasSmartGuidanceTranscript, sessionId, smartGuidanceRequestBody]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSelection = readPracticeSessionSelection(sessionId);

      if (storedSelection) {
        setPracticeSessionSelection(
          normalizePracticeSessionSelection(sessionId, storedSelection),
        );
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sessionId]);

  function setTranscriptState(nextTurns: TranscriptTurn[]) {
    transcriptTurnsRef.current = nextTurns;
    setTranscriptTurns(nextTurns);
  }

  function updateTurnTranslation(turnId: string, translationZh: string) {
    const nextTurns = transcriptTurnsRef.current.map((turn) =>
      turn.id === turnId ? { ...turn, translationZh } : turn,
    );

    setTranscriptState(nextTurns);
  }

  async function translateTranscriptTurn(turn: TranscriptTurn) {
    if (turn.speaker !== "ai_customer" || turn.translationZh) {
      return;
    }

    try {
      const response = await fetch("/api/subtitle-translation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          speaker: turn.speaker,
          text: turn.text,
        }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as SubtitleTranslationResponse;
      const translationZh = payload.translationZh?.trim();

      if (translationZh) {
        updateTurnTranslation(turn.id, translationZh);
      }
    } catch {
      // Subtitle translation is helpful for review, but it must not interrupt live voice.
    }
  }

  function appendTurn(
    turn: Omit<TranscriptTurn, "id" | "timestamp"> & {
      timestamp?: number;
    },
  ) {
    const currentTurns = transcriptTurnsRef.current;
    const nextTurn: TranscriptTurn = {
      id: nextTurnId(),
      timestamp: turn.timestamp ?? currentTurns.length * 8,
      speaker: turn.speaker,
      text: turn.text,
      translationZh: turn.translationZh,
    };
    const nextTurns: TranscriptTurn[] = [
      ...currentTurns,
      nextTurn,
    ];

    setTranscriptState(nextTurns);

    void translateTranscriptTurn(nextTurn);

    return nextTurns;
  }

  function addSystemTurn(text: string) {
    setSystemNotice(text);
    return appendTurn({
      speaker: "system",
      text,
    });
  }

  function appendTranscriptPart(currentText: string, nextPart: string) {
    const trimmedPart = nextPart.trim();

    if (!trimmedPart) {
      return currentText;
    }

    if (!currentText.trim()) {
      return trimmedPart;
    }

    if (/^[.,!?;:)]/.test(trimmedPart) || /\s$/.test(currentText)) {
      return `${currentText}${trimmedPart}`;
    }

    return `${currentText} ${trimmedPart}`;
  }

  function closeRealtimeConnection() {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    relaySocketRef.current?.close();
    relaySocketRef.current = null;
    relayInputProcessorRef.current?.disconnect();
    relayInputProcessorRef.current = null;
    relayInputAudioSourceRef.current?.disconnect();
    relayInputAudioSourceRef.current = null;
    void relayInputAudioContextRef.current?.close();
    relayInputAudioContextRef.current = null;
    relayOutputTimeRef.current = 0;
    void relayOutputAudioContextRef.current?.close();
    relayOutputAudioContextRef.current = null;
    pendingAITranscriptRef.current = "";
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    mediaStreamRef.current = null;
  }

  async function requestRealtimeSession() {
    const currentPracticeSession = normalizePracticeSessionSelection(
      sessionId,
      readPracticeSessionSelection(sessionId) ?? practiceSessionSelectionRef.current,
    );
    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenarioPackId: currentPracticeSession.scenarioPackId,
        goalId: currentPracticeSession.goalId,
        practiceSessionId: sessionId,
        personaId: currentPracticeSession.personaId,
        voicePackId: currentPracticeSession.voicePackId,
        mode: currentPracticeSession.mode,
        materialId: currentPracticeSession.materialId,
        prepCardId: currentPracticeSession.prepCardId,
        trainingFocus: currentPracticeSession.trainingFocus,
        focusTags: currentPracticeSession.focusTags,
        memorySnippets:
          currentPracticeSession.resolvedContext?.memorySnippets ?? [],
        resolvedContext: currentPracticeSession.resolvedContext,
      }),
    });

    if (!response.ok) {
      throw new Error("实时会话创建失败。");
    }

    return (await response.json()) as RealtimeSessionResponse;
  }

  function handleRealtimeEvent(message: MessageEvent<string>) {
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(message.data) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = event.type;
    const text = eventText(event);
    const audioDelta = event.delta;

    if (type === "error" || type === "relay.error") {
      closeRealtimeConnection();
      setState("Connection Error");
      addSystemTurn(userFacingRealtimeError(realtimeErrorMessage(event)));
      return;
    }

    if (type === "response.audio.delta" && typeof audioDelta === "string") {
      void playPCM16AudioDelta(audioDelta);
    }

    if (
      type === "response.audio_transcript.delta" &&
      typeof audioDelta === "string"
    ) {
      pendingAITranscriptRef.current = appendTranscriptPart(
        pendingAITranscriptRef.current,
        audioDelta,
      );
      return;
    }

    if (type === "response.done") {
      const pendingTranscript = pendingAITranscriptRef.current.trim();
      pendingAITranscriptRef.current = "";

      if (pendingTranscript) {
        appendTurn({
          speaker: "ai_customer",
          text: pendingTranscript,
        });
      }
      return;
    }

    if (!text) {
      return;
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      appendTurn({
        speaker: "user",
        text,
      });
      return;
    }

    if (
      type === "response.audio_transcript.done" ||
      type === "response.text.done"
    ) {
      appendTurn({
        speaker: "ai_customer",
        text,
      });
    }
  }

  function parseRealtimeEvent(message: MessageEvent<string>) {
    try {
      return JSON.parse(message.data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  function relayOutputAudioContext() {
    const AudioContextConstructor = getBrowserAudioContext();

    if (!AudioContextConstructor) {
      return null;
    }

    const audioContext =
      relayOutputAudioContextRef.current ?? new AudioContextConstructor();
    relayOutputAudioContextRef.current = audioContext;

    return audioContext;
  }

  function unlockRelayOutputAudio() {
    const audioContext = relayOutputAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }

    const buffer = audioContext.createBuffer(
      1,
      1,
      DEFAULT_OUTPUT_AUDIO_SAMPLE_RATE,
    );
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(audioContext.currentTime);
  }

  async function playPCM16AudioDelta(base64Audio: string) {
    const audioContext = relayOutputAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => undefined);
    }

    const samples = decodePCM16Base64ToFloat32(base64Audio);
    const audioBuffer = audioContext.createBuffer(
      1,
      samples.length,
      DEFAULT_OUTPUT_AUDIO_SAMPLE_RATE,
    );
    audioBuffer.copyToChannel(samples, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    const startAt = Math.max(audioContext.currentTime, relayOutputTimeRef.current);
    source.start(startAt);
    relayOutputTimeRef.current = startAt + audioBuffer.duration;
  }

  function sendRealtimeEvent(event: Record<string, unknown>) {
    const serializedEvent = JSON.stringify(event);
    const dataChannel = dataChannelRef.current;

    if (dataChannel?.readyState === "open") {
      dataChannel.send(serializedEvent);
      return;
    }

    const relaySocket = relaySocketRef.current;

    if (relaySocket?.readyState === WebSocket.OPEN) {
      relaySocket.send(serializedEvent);
    }
  }

  async function startRelayMicrophoneStreaming(
    stream: MediaStream,
    inputAudioSampleRate = DEFAULT_INPUT_AUDIO_SAMPLE_RATE,
  ) {
    const AudioContextConstructor = getBrowserAudioContext();

    if (!AudioContextConstructor) {
      throw new Error("当前浏览器无法初始化实时音频。");
    }

    const audioContext = new AudioContextConstructor();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(
      INPUT_AUDIO_BUFFER_SIZE,
      1,
      1,
    );

    processor.onaudioprocess = (event) => {
      const output = event.outputBuffer.getChannelData(0);
      output.fill(0);

      const relaySocket = relaySocketRef.current;

      if (
        !relaySocket ||
        relaySocket.readyState !== WebSocket.OPEN ||
        isMutedRef.current
      ) {
        return;
      }

      const audio = encodeFloat32AudioToPCM16Base64(
        event.inputBuffer.getChannelData(0),
        {
          inputSampleRate: audioContext.sampleRate,
          outputSampleRate: inputAudioSampleRate,
        },
      );

      relaySocket.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio,
        }),
      );
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    relayInputAudioContextRef.current = audioContext;
    relayInputAudioSourceRef.current = source;
    relayInputProcessorRef.current = processor;
  }

  async function connectRealtimeWebSocketRelay(
    stream: MediaStream,
    realtimeSession: RealtimeRelaySessionResponse,
  ) {
    const relayUrl = new URL(realtimeSession.relayUrl);
    relayUrl.searchParams.set("token", realtimeSession.relayToken);

    const relaySocket = new WebSocket(relayUrl);
    relaySocketRef.current = relaySocket;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        settle(() => {
          reject(new Error("实时 Relay 连接超时。"));
        });
      }, RELAY_READY_TIMEOUT_MS);

      function settle(callback: () => void) {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        callback();
      }
      const startRelaySession = () => {
        const selectedPracticeSession = practiceSessionSelectionRef.current;

        setState("In Conversation");
        addSystemTurn(`实时 Relay 会话 ${realtimeSession.sessionId} 已连接。`);
        void startRelayMicrophoneStreaming(
          stream,
          realtimeSession.inputAudioSampleRate,
        ).catch(() => {
          addSystemTurn("实时音频初始化失败，请检查浏览器音频权限。");
        });
        sendRealtimeEvent({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: buildStartRoleplayInstructions(selectedPracticeSession),
          },
        });
      };

      relaySocket.addEventListener("message", handleRealtimeEvent);
      relaySocket.addEventListener("message", (message) => {
        const event = parseRealtimeEvent(message);

        if (event?.type === "relay.ready") {
          settle(() => {
            startRelaySession();
            resolve();
          });
          return;
        }

        if (event?.type === "relay.error") {
          settle(() => {
            reject(new Error("实时 Relay 无法连接到模型服务。"));
          });
        }
      });
      relaySocket.addEventListener(
        "open",
        () => {
          addSystemTurn("实时 Relay 已连接，正在等待模型服务就绪。");
        },
        { once: true },
      );
      relaySocket.addEventListener(
        "error",
        () => {
          settle(() => {
            reject(
              new Error(
                "实时 Relay 连接失败，请确认当前网址已加入 Relay 白名单。",
              ),
            );
          });
        },
        { once: true },
      );
      relaySocket.addEventListener(
        "close",
        () => {
          settle(() => {
            reject(new Error("实时 Relay 连接已关闭。"));
          });
        },
        { once: true },
      );
    });
  }

  async function connectRealtimeWebRTC(
    stream: MediaStream,
    realtimeSession: RealtimeSessionResponse,
  ) {
    if (isRelayRealtimeCredential(realtimeSession)) {
      await connectRealtimeWebSocketRelay(stream, realtimeSession);
      return;
    }

    const PeerConnection = globalThis.RTCPeerConnection;

    if (
      isMockRealtimeCredential(realtimeSession.clientSecret) ||
      typeof PeerConnection === "undefined"
    ) {
      setState("In Conversation");
      addSystemTurn(`模拟实时会话 ${realtimeSession.sessionId} 已开始。`);
      return;
    }

    const peerConnection = new PeerConnection();
    peerConnectionRef.current = peerConnection;

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;

      if (audioRef.current && remoteStream) {
        audioRef.current.srcObject = remoteStream;
        void audioRef.current.play().catch(() => undefined);
      }
    };

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    const dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannelRef.current = dataChannel;
    dataChannel.addEventListener("message", handleRealtimeEvent);
    dataChannel.addEventListener("open", () => {
      const selectedPracticeSession = practiceSessionSelectionRef.current;

      sendRealtimeEvent({
        type: "response.create",
        response: {
          instructions: buildStartRoleplayInstructions(selectedPracticeSession),
        },
      });
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${realtimeSession.clientSecret}`,
          "Content-Type": "application/sdp",
        },
      },
    );

    if (!sdpResponse.ok) {
      throw new Error("实时语音连接失败。");
    }

    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: await sdpResponse.text(),
    });
    setState("In Conversation");
    addSystemTurn(`实时语音会话 ${realtimeSession.sessionId} 已连接。`);
  }

  async function handleStart() {
    if (state === "In Conversation" || state === "Muted") {
      return;
    }

    unlockRelayOutputAudio();
    setState("Reconnecting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("Mic Permission Required");
        addSystemTurn("当前浏览器无法使用麦克风。");
        return;
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setState("Mic Permission Required");
        addSystemTurn("开始语音练习需要麦克风权限。");
        return;
      }

      mediaStreamRef.current = stream;
      const realtimeSession = await requestRealtimeSession();
      await connectRealtimeWebRTC(stream, realtimeSession);
    } catch (error) {
      closeRealtimeConnection();
      setState("Connection Error");
      addSystemTurn(
        error instanceof Error
          ? userFacingRealtimeError(error.message)
          : "实时连接失败，请稍后重试。",
      );
    }
  }

  async function saveTranscript(turns: TranscriptTurn[]) {
    const conversationTurns = turns.filter((turn) => turn.speaker !== "system");

    const response = await fetch(
      `/api/practice-sessions/${sessionId}/transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turns: conversationTurns.map((turn) => ({
            speaker: turn.speaker,
            text: turn.text,
            timestamp: turn.timestamp,
            metadata: {
              source: "realtime_room",
            },
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("保存转写失败。");
    }
  }

  async function generateReview() {
    const response = await fetch(`/api/practice-sessions/${sessionId}/review`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("生成复盘失败。");
    }

    return response.json() as Promise<{
      reviewId?: string;
    }>;
  }

  async function handleEnd() {
    closeRealtimeConnection();
    setIsMuted(false);
    setState("Session Ended");
    const turnsToSave = addSystemTurn("会话已结束，正在保存转写并生成复盘。");

    try {
      await saveTranscript(turnsToSave);
      const reviewPayload = await generateReview();
      const recommendationId = practiceSessionSelectionRef.current.recommendationId;

      if (
        practiceSessionSelectionRef.current.source === "today-recommendation" &&
        recommendationId
      ) {
        void completeTodayRecommendationAndPrefetch(recommendationId);
      }
      addSystemTurn(
        reviewPayload.reviewId
          ? "复盘已生成，可在复盘页面查看。"
          : "转写已保存，复盘已生成。",
      );
    } catch {
      addSystemTurn("练习记录暂时无法保存或生成复盘，请稍后重试。");
    }
  }

  function handleMute() {
    const stream = mediaStreamRef.current;

    setIsMuted((currentMuted) => {
      const nextMuted = !currentMuted;
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      if (nextMuted) {
        sendRealtimeEvent({
          type: "input_audio_buffer.end",
        });
      }
      setState(nextMuted ? "Muted" : "In Conversation");
      isMutedRef.current = nextMuted;
      return nextMuted;
    });
  }

  function latestAiCustomerTurn() {
    return [...transcriptTurnsRef.current]
      .reverse()
      .find((turn) => turn.speaker === "ai_customer");
  }

  function conversationTranscriptPayload() {
    return transcriptTurnsRef.current
      .filter((turn) => turn.speaker !== "system")
      .map((turn) => ({
        speaker: turn.speaker,
        text: turn.text,
        timestamp: turn.timestamp,
        metadata: {},
      }));
  }

  function upsertSupportResultTab(tab: SupportResultTab) {
    setSupportResultTabs((currentTabs) => {
      const existingIndex = currentTabs.findIndex(
        (currentTab) => currentTab.id === tab.id,
      );

      if (existingIndex === -1) {
        return [...currentTabs, tab];
      }

      const nextTabs = [...currentTabs];
      nextTabs[existingIndex] = {
        ...currentTabs[existingIndex],
        ...tab,
      };

      return nextTabs;
    });
    setActiveSupportResultTabId(tab.id);
  }

  function activateExistingSupportResultTab(type: SupportResultTabType) {
    const existingTab = supportResultTabs.find((tab) => tab.type === type);

    if (!existingTab) {
      return false;
    }

    setActiveSupportResultTabId(existingTab.id);
    return true;
  }

  function closeSupportResultTab(tabId: string) {
    const closingIndex = supportResultTabs.findIndex((tab) => tab.id === tabId);

    if (closingIndex === -1) {
      return;
    }

    const nextTabs = supportResultTabs.filter((tab) => tab.id !== tabId);
    setSupportResultTabs(nextTabs);

    if (
      activeSupportResultTabId === tabId ||
      !nextTabs.some((tab) => tab.id === activeSupportResultTabId)
    ) {
      const nextActiveTab =
        nextTabs[closingIndex - 1] ?? nextTabs[closingIndex] ?? null;
      setActiveSupportResultTabId(nextActiveTab?.id ?? null);
    }
  }

  function closeSupportPanelOnNarrowViewport() {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setIsSupportOpen(false);
    }
  }

  async function handleSuggestedAnswer(options?: { force?: boolean }) {
    const tabId = supportResultTabId("suggested-answer");

    if (!options?.force && activateExistingSupportResultTab("suggested-answer")) {
      closeSupportPanelOnNarrowViewport();
      return;
    }

    const latestAiTurn = latestAiCustomerTurn();

    if (!latestAiTurn) {
      upsertSupportResultTab({
        id: tabId,
        title: supportResultTabTitles["suggested-answer"],
        type: "suggested-answer",
        status: "error",
        errorMessage: "等 AI 客户提出问题后，再使用建议回答。",
      });
      closeSupportPanelOnNarrowViewport();
      return;
    }

    upsertSupportResultTab({
      id: tabId,
      title: supportResultTabTitles["suggested-answer"],
      type: "suggested-answer",
      status: "loading",
    });
    closeSupportPanelOnNarrowViewport();

    try {
      const response = await fetch(
        `/api/practice-sessions/${sessionId}/suggested-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            practiceSession: practiceSessionSelectionRef.current,
            latestAiTurn: {
              speaker: latestAiTurn.speaker,
              text: latestAiTurn.text,
              translationZh: latestAiTurn.translationZh,
              timestamp: latestAiTurn.timestamp,
              metadata: {},
            },
            transcriptTurns: conversationTranscriptPayload(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("建议回答生成失败。");
      }

      const payload = (await response.json()) as SuggestedAnswerResponse;

      if (!payload.suggestion) {
        throw new Error("建议回答为空。");
      }

      upsertSupportResultTab({
        id: tabId,
        title: supportResultTabTitles["suggested-answer"],
        type: "suggested-answer",
        status: "ready",
        payload: payload.suggestion,
      });
      setSystemNotice("建议回答已生成，并记录到表达库和复盘。");
    } catch {
      upsertSupportResultTab({
        id: tabId,
        title: supportResultTabTitles["suggested-answer"],
        type: "suggested-answer",
        status: "error",
        errorMessage: "建议回答暂时无法生成，请稍后重试。",
      });
    }
  }

  async function handleCue(cue: SmartCue, options?: { force?: boolean }) {
    if (cue === "Suggested Answer") {
      void handleSuggestedAnswer(options);
      return;
    }

    const tabType = cueToSupportResultTabType[cue];
    const tabId = supportResultTabId(tabType);

    if (!options?.force && activateExistingSupportResultTab(tabType)) {
      closeSupportPanelOnNarrowViewport();
      return;
    }

    upsertSupportResultTab({
      id: tabId,
      title: supportResultTabTitles[tabType],
      type: tabType,
      status: "loading",
    });
    closeSupportPanelOnNarrowViewport();
    setSystemNotice(supportCueNotices[cue]);

    try {
      const response = await fetch(
        `/api/practice-sessions/${sessionId}/support-cue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cue,
            practiceSession: practiceSessionSelectionRef.current,
            transcriptTurns: conversationTranscriptPayload(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("提示分析生成失败。");
      }

      const payload = (await response.json()) as SupportCueResponse;

      if (!payload.cueResult) {
        throw new Error("提示分析为空。");
      }

      upsertSupportResultTab({
        id: tabId,
        title: supportResultTabTitles[tabType],
        type: tabType,
        status: "ready",
        payload: payload.cueResult,
      });
      setSystemNotice(`${supportCueNotices[cue]}已由 AI 结合上下文生成。`);
    } catch {
      upsertSupportResultTab({
        id: tabId,
        title: supportResultTabTitles[tabType],
        type: tabType,
        status: "error",
        errorMessage: "AI 分析暂时不可用，请稍后重试。",
      });
    }
  }

  function retrySupportResultTab(tabId: string) {
    const tab = supportResultTabs.find((supportTab) => supportTab.id === tabId);

    if (!tab) {
      return;
    }

    if (tab.type === "suggested-answer") {
      void handleSuggestedAnswer({ force: true });
      return;
    }

    void handleCue(supportResultTabTypeToCue[tab.type], { force: true });
  }

  function activeSupportResultTab() {
    if (supportResultTabs.length === 0) {
      return null;
    }

    return (
      supportResultTabs.find((tab) => tab.id === activeSupportResultTabId) ??
      supportResultTabs[supportResultTabs.length - 1]
    );
  }

  function renderActiveSupportResult() {
    const activeTab = activeSupportResultTab();

    if (!activeTab) {
      return null;
    }

    if (activeTab.type === "suggested-answer") {
      return (
        <SuggestedAnswerPanel
          errorMessage={activeTab.errorMessage ?? null}
          isLoading={activeTab.status === "loading"}
          suggestion={
            activeTab.status === "ready"
              ? (activeTab.payload as SuggestedAnswerRecord | undefined) ?? null
              : null
          }
        />
      );
    }

    return (
      <SupportCueResultPanel
        errorMessage={activeTab.errorMessage ?? null}
        isLoading={activeTab.status === "loading"}
        result={(activeTab.payload as SupportCueResult | undefined) ?? null}
      />
    );
  }

  return (
    <>
      <audio ref={audioRef} autoPlay className="hidden" />
      <PageHeader
        eyebrow="实时练习室"
        title="实时会议练习"
        description="Practice a customer conversation with material guidance, live transcript, and smart support controls."
      />
      <div className="mx-auto w-full max-w-7xl">
        {!isSupportOpen ? (
          <button
            type="button"
            aria-label="打开提示面板"
            aria-controls="smart-support-panel"
            aria-expanded={false}
            onClick={() => setIsSupportOpen(true)}
            className="fixed right-5 top-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--warning)] shadow-sm transition hover:border-[var(--warning)] hover:bg-[#fff8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <section
          className={
            isSupportOpen
              ? "grid w-full gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]"
              : "mx-auto grid w-full max-w-5xl gap-4"
          }
        >
          <div className="grid min-w-0 gap-4">
            <LiveMeetingPanel
              state={state}
              onStart={handleStart}
              onMute={handleMute}
              onEnd={handleEnd}
              isMuted={isMuted}
              voicePackLabel={resolveVoicePackLabel(
                practiceSessionSelection.voicePackId,
              )}
            />
            {systemNotice ? (
              <p
                role="status"
                title={systemNotice}
                className="flex min-h-10 items-center truncate rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-medium leading-5 text-[var(--muted)]"
              >
                {systemNotice}
              </p>
            ) : null}
            <ConversationTranscriptPanel turns={transcriptTurns} />
            <SupportResultWorkspace
              activeTabId={activeSupportResultTabId}
              onCloseTab={closeSupportResultTab}
              onRetryTab={retrySupportResultTab}
              onSelectTab={setActiveSupportResultTabId}
              tabs={supportResultTabs}
            >
              {renderActiveSupportResult()}
            </SupportResultWorkspace>
          </div>

          {isSupportOpen ? (
            <aside
              id="smart-support-panel"
              aria-label="提示"
              className="fixed inset-x-0 bottom-0 z-40 max-h-[58dvh] min-w-0 overflow-y-auto rounded-t-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-5 lg:z-auto lg:max-h-[calc(100dvh-2.5rem)] lg:self-start lg:rounded-md lg:shadow-none"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb
                    className="h-5 w-5 text-[var(--warning)]"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-semibold text-[var(--foreground)]">
                    提示
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="关闭提示面板"
                  onClick={() => setIsSupportOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border)] transition hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <SmartSupportPanel
                embedded
                guidance={smartGuidance}
                guidanceError={currentSmartGuidanceError}
                guidanceStatus={smartGuidanceStatus}
                onCue={handleCue}
              />
            </aside>
          ) : null}
        </section>
      </div>
    </>
  );
}
