import { afterEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY:
    "DeepSeek text analysis boundary: Use DeepSeek only for offline JSON text analysis outside the realtime audio loop.",
  generateTextJSON: generateTextJSONMock,
  hasTextAIApiKey: () => true,
}));

import { generateTodayRecommendation } from "@/lib/recommendations/today-recommendation";
import type { ProgressSummary } from "@/lib/progress/weakness-store";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

const progress: ProgressSummary = {
  recentTrainingCount: 4,
  topWeaknesses: [
    {
      id: "weakness_competitor",
      type: "unclear_positioning",
      label: "定位不清晰",
      severity: 4,
      evidence:
        "The learner compared Rokid with phone translation apps without explaining the workflow difference.",
      recommendedDrill: "竞品差异说明",
      occurrences: 2,
      lastSeenAt: "2026-05-23T12:00:00.000Z",
    },
  ],
  improvedWeaknesses: [],
  recommendedDrills: ["竞品差异说明"],
  history: [],
};

describe("today practice recommendation", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("uses the text AI model and backend context to generate the daily recommendation", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "采购经理 · 竞品差异说明",
      reason:
        "基于最近复盘，用户在说明 Rokid 与手机翻译的差异时缺少 workflow 角度，今天适合练习更清晰的竞品差异表达。",
      goalId: "competitive_differences",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      materialMode: "recent_material",
      materialId: "material_recent",
      materialLabel: "Rokid competitor comparison deck",
      durationMinutes: 12,
      evidence: ["unclear positioning", "recent competitor material"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [
        {
          id: "material_recent",
          name: "Rokid competitor comparison deck",
          processingStatus: "ready",
          memoryStatus: "available_for_future",
          confidentialMode: false,
          createdAt: "2026-05-23T10:00:00.000Z",
          updatedAt: "2026-05-23T10:00:00.000Z",
        },
      ],
      memories: [
        {
          id: "memory_positioning",
          scenarioPackId: "rokid-overseas-sales",
          type: "speaking_habit",
          title: "Weak competitor positioning",
          summary:
            "The learner often lists features before explaining why hands-free workflow matters.",
          source: "system",
          sourceCreatedAt: "2026-05-23T10:00:00.000Z",
          confidence: 0.8,
          importance: 4,
          lastUsedAt: null,
          useCount: 2,
          enabledForAi: true,
          sensitive: false,
          expiresAt: null,
          createdAt: "2026-05-23T10:00:00.000Z",
          updatedAt: "2026-05-23T10:00:00.000Z",
        },
      ],
    });

    expect(generateTextJSONMock).toHaveBeenCalledTimes(1);
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("The learner compared Rokid with phone translation apps");
    expect(prompt).toContain("Rokid competitor comparison deck");
    expect(prompt).toContain("Weak competitor positioning");
    expect(prompt).toContain("competitive_differences");
    expect(prompt).toContain("Configured recommendation packages");
    expect(prompt).toContain(
      "application_scenarios:enterprise_buyer:kore-firm:memory_context",
    );
    expect(recommendation).toMatchObject({
      title: "采购经理 · 竞品差异说明",
      goalId: "competitive_differences",
      goalLabel: "竞品差异说明",
      personaId: "procurement_manager",
      personaLabel: "采购经理",
      voicePackId: "fenrir-excitable",
      voicePackLabel: "Fenrir 高能追问",
      materialLabel: "Rokid competitor comparison deck",
      source: "ai",
    });
  });

  it("avoids returning an excluded recommendation package", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "采购经理 · 竞品差异说明",
      reason:
        "基于最近复盘，用户在说明 Rokid 与手机翻译的差异时缺少 workflow 角度，今天适合练习更清晰的竞品差异表达。",
      goalId: "competitive_differences",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 12,
      evidence: ["unclear positioning"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [],
      memories: [],
      excludedRecommendationIds: [
        "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
      ],
    });

    expect(recommendation.id).not.toBe(
      "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
    );
    expect(recommendation.title).not.toBe("采购经理 · 竞品差异说明");
  });

  it("treats the same goal role and voice as excluded even when material mode changes", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "采购经理 · 竞品差异说明",
      reason:
        "基于最近复盘，用户在说明 Rokid 与手机翻译的差异时缺少 workflow 角度，今天适合练习更清晰的竞品差异表达。",
      goalId: "competitive_differences",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      materialMode: "recent_material",
      materialId: "material_recent",
      materialLabel: "Rokid competitor comparison deck",
      durationMinutes: 12,
      evidence: ["unclear positioning"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [
        {
          id: "material_recent",
          name: "Rokid competitor comparison deck",
          processingStatus: "ready",
          memoryStatus: "available_for_future",
          confidentialMode: false,
          createdAt: "2026-05-23T10:00:00.000Z",
          updatedAt: "2026-05-23T10:00:00.000Z",
        },
      ],
      memories: [],
      excludedRecommendationIds: [
        "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
      ],
    });

    expect(recommendation.id.startsWith(
      "competitive_differences:procurement_manager:fenrir-excitable",
    )).toBe(false);
    expect(recommendation.title).not.toBe("采购经理 · 竞品差异说明");
  });

  it("keeps rotating fallback packages when several shown packages are excluded", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "采购经理 · 竞品差异说明",
      reason:
        "基于最近复盘，用户在说明 Rokid 与手机翻译的差异时缺少 workflow 角度，今天适合练习更清晰的竞品差异表达。",
      goalId: "competitive_differences",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 12,
      evidence: ["unclear positioning"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [],
      memories: [],
      excludedRecommendationIds: [
        "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
        "customer_qa:enterprise_buyer:kore-firm:memory_context",
      ],
    });

    expect(recommendation.id).toBe(
      "demo_narration:channel_partner:zephyr-bright:memory_context",
    );
    expect(recommendation.title).toBe("渠道合作伙伴 · 产品演示讲解");
  });

  it("uses long-term review analytics when generating today's recommendation", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    const analytics: ReviewAnalyticsSnapshot = {
      id: "review_analytics_7d",
      range: "7d",
      generatedAt: "2026-05-24T09:00:00.000Z",
      staleAfter: "2026-05-24T23:59:59.999Z",
      sourceReviewIds: ["review_1", "review_2"],
      sourceSessionIds: ["session_1", "session_2"],
      trainingCount: 2,
      summaryZh: "隐私和部署回答仍然偏长。",
      topGrowthSignals: [],
      recurringMistakes: [],
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
      aiGenerated: true,
    };
    generateTextJSONMock.mockResolvedValueOnce({
      title: "技术负责人 · 隐私与部署推进",
      reason: "长期复盘显示隐私和部署回答仍然偏长，今天适合练短回答。",
      goalId: "privacy_security",
      personaId: "technical_lead",
      voicePackId: "charon-informative",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 8,
      evidence: ["长期复盘建议练短回答"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [],
      memories: [],
      analytics,
    });

    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("长期复盘");
    expect(prompt).toContain("隐私和部署回答仍然偏长");
    expect(prompt).toContain("技术负责人 · 隐私与部署推进");
    expect(recommendation.personaId).toBe("technical_lead");
  });
});
