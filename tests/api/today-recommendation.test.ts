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

import { GET as getTodayRecommendation } from "@/app/api/today-recommendation/route";
import { resetTodayRecommendationPoolsForTest } from "@/lib/recommendations/today-recommendation-pool";

describe("today recommendation API", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
    resetTodayRecommendationPoolsForTest();
    vi.unstubAllEnvs();
  });

  it("serves a preloaded daily pool and rotates to the next package without realtime AI", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      title: "企业买家 · 应用场景说明",
      reason:
        "AI 根据系统记忆发现用户容易先讲功能，今天建议先练应用场景和客户价值连接。",
      goalId: "application_scenarios",
      personaId: "enterprise_buyer",
      voicePackId: "kore-firm",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 10,
      evidence: ["Feature-first answering pattern"],
    });

    const firstResponse = await getTodayRecommendation(
      new Request("http://localhost/api/today-recommendation"),
    );
    const firstPayload = (await firstResponse.json()) as {
      pool?: { activeIndex: number; size: number };
      recommendation?: { id: string; title: string; source: string };
    };
    const secondResponse = await getTodayRecommendation(
      new Request("http://localhost/api/today-recommendation?refresh=1"),
    );
    const secondPayload = (await secondResponse.json()) as {
      pool?: { activeIndex: number; size: number };
      recommendation?: { id: string; title: string; source: string };
    };

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(generateTextJSONMock).not.toHaveBeenCalled();
    expect(firstPayload.pool).toEqual({ activeIndex: 0, size: 10 });
    expect(secondPayload.pool).toEqual({ activeIndex: 1, size: 10 });
    expect(firstPayload.recommendation?.source).toBe("fallback");
    expect(secondPayload.recommendation?.source).toBe("fallback");
    expect(secondPayload.recommendation?.id).not.toBe(
      firstPayload.recommendation?.id,
    );
  });
});
