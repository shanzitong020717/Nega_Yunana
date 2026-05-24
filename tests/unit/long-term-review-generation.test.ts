import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY:
    "DeepSeek text analysis boundary: Use DeepSeek only for offline JSON text analysis outside the realtime audio loop.",
  generateTextJSON: generateTextJSONMock,
}));

import { generateLongTermReviewSnapshot } from "@/lib/ai/long-term-review";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

const draft: ReviewAnalyticsSnapshot = {
  id: "review_analytics_7d",
  range: "7d",
  generatedAt: "2026-05-24T09:00:00.000Z",
  staleAfter: "2026-05-24T23:59:59.999Z",
  sourceReviewIds: ["review_1", "review_2"],
  sourceSessionIds: ["session_1", "session_2"],
  trainingCount: 2,
  summaryZh: "隐私和部署回答仍然偏长。",
  topGrowthSignals: [],
  recurringMistakes: [
    {
      id: "mistake_word_choice_translation_function",
      category: "word_choice",
      title: "translation function 直译",
      occurrenceCount: 2,
      averageSeverity: 3,
      lastSeenAt: "2026-05-24T08:00:00.000Z",
      examples: [
        {
          reviewId: "review_1",
          sessionId: "session_1",
          original: "We have translation function.",
          correction: "real-time translated captions",
          explanationZh: "功能表述需要换成客户能理解的产品能力。",
        },
      ],
      recommendedDrill: "功能转价值练习",
    },
  ],
  naturalnessPatterns: [],
  phraseGrowth: {
    newPhraseCount: 0,
    reviewGeneratedPhraseCount: 0,
    vocabularyItems: [],
    reusableSentences: [],
  },
  memoryInsights: [],
  nextTrainingPlan: {
    title: "技术负责人 · 隐私与部署推进",
    reasonZh: "长期复盘建议练短回答。",
    goalId: "privacy_security",
    mode: "objection_challenge",
    personaId: "technical_lead",
    voicePackId: "charon-informative",
    materialMode: "memory_context",
    focusTags: ["隐私安全", "部署推进"],
    estimatedMinutes: 8,
  },
  aiGenerated: false,
};

describe("generateLongTermReviewSnapshot", () => {
  beforeEach(() => {
    generateTextJSONMock.mockReset();
  });

  it("asks DeepSeek to refine the deterministic draft and validates strict JSON", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      ...draft,
      summaryZh:
        "近 7 天你能更清楚地说明客户价值，但隐私、部署和下一步推进仍要更短。",
      topGrowthSignals: [
        {
          id: "growth_business_value",
          title: "客户价值表达更清楚",
          summaryZh: "你开始把实时字幕连接到会议效率。",
          evidence: ["Rokid makes multilingual meetings easier to follow."],
          confidence: 0.82,
        },
      ],
      aiGenerated: true,
    });

    const snapshot = await generateLongTermReviewSnapshot({
      draft,
      sentenceReviewSummaries: [
        {
          original: "We have translation function.",
          issueTypes: ["word_choice"],
          correction: "real-time translated captions",
        },
      ],
      weaknessSummaries: [
        {
          type: "feature_only_talk",
          evidence: "The learner started from features before customer value.",
        },
      ],
      memorySummaries: [
        {
          title: "Feature-first answering pattern",
          summary: "Learner starts with features.",
        },
      ],
    });

    expect(generateTextJSONMock).toHaveBeenCalledTimes(1);
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("长期复盘");
    expect(prompt).toContain("We have translation function.");
    expect(prompt).toContain("feature_only_talk");
    expect(prompt).not.toContain("metadata");
    expect(snapshot.aiGenerated).toBe(true);
    expect(snapshot.summaryZh).toContain("近 7 天");
  });

  it("falls back to the deterministic draft when AI output is invalid", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      summaryZh: "",
    });

    const snapshot = await generateLongTermReviewSnapshot({
      draft,
      sentenceReviewSummaries: [],
      weaknessSummaries: [],
      memorySummaries: [],
    });

    expect(snapshot).toMatchObject({
      id: draft.id,
      aiGenerated: false,
      summaryZh: draft.summaryZh,
    });
  });
});
