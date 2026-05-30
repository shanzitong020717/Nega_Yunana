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

import type { ProgressSummary } from "@/lib/progress/weakness-store";
import {
  buildPresetTodayRecommendationPool,
  generateTodayRecommendation,
} from "@/lib/recommendations/today-recommendation";

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

function packageKey(recommendation: {
  goalId: string;
  personaId: string;
  voicePackId: string;
}) {
  return [
    recommendation.goalId,
    recommendation.personaId,
    recommendation.voicePackId,
  ].join(":");
}

describe("today practice recommendation", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("uses configured random packages instead of the text AI model", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "采购经理 · 竞品差异说明",
      reason: "这条 AI 返回不应该被首页今日建议使用。",
      goalId: "competitive_differences",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 12,
      evidence: ["ai result"],
    });

    const recommendation = await generateTodayRecommendation({
      progress,
      recentMaterials: [],
      memories: [],
    });

    expect(generateTextJSONMock).not.toHaveBeenCalled();
    expect(recommendation.source).toBe("fallback");
    expect(recommendation.reason).toContain("推荐原因");
    expect(recommendation.href).toContain("source=today-recommendation");
  });

  it("builds a random configured pool whose first three refreshes are different packages", () => {
    const randomValues = [
      0.01, 0.82, 0.13, 0.74, 0.25, 0.66, 0.37, 0.58, 0.49, 0.9, 0.05, 0.95,
    ];
    let index = 0;

    const pool = buildPresetTodayRecommendationPool({
      progress,
      recentMaterials: [],
      memories: [],
      random: () => randomValues[index++ % randomValues.length],
    });
    const firstThreeRefreshes = pool.slice(1, 4).map(packageKey);

    expect(pool).toHaveLength(10);
    expect(new Set(pool.map(packageKey)).size).toBe(pool.length);
    expect(new Set(firstThreeRefreshes).size).toBe(3);
  });
});
