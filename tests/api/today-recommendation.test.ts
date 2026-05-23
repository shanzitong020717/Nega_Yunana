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

describe("today recommendation API", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("returns an AI-generated recommendation from backend context", async () => {
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

    const response = await getTodayRecommendation(
      new Request("http://localhost/api/today-recommendation"),
    );
    const payload = (await response.json()) as {
      recommendation?: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(generateTextJSONMock).toHaveBeenCalledTimes(1);
    expect(payload.recommendation).toMatchObject({
      title: "企业买家 · 应用场景说明",
      goalLabel: "应用场景说明",
      personaLabel: "企业买家",
      voicePackLabel: "Kore 坚定专业",
      source: "ai",
    });
  });
});
