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
import {
  resetTodayRecommendationPoolsForTest,
  todayRecommendationDateKey,
} from "@/lib/recommendations/today-recommendation-pool";

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
    expect(firstPayload.pool).toEqual({ activeIndex: 0, size: 30 });
    expect(secondPayload.pool).toEqual({ activeIndex: 1, size: 30 });
    expect(firstPayload.recommendation?.source).toBe("fallback");
    expect(secondPayload.recommendation?.source).toBe("fallback");
    expect(secondPayload.recommendation?.id).not.toBe(
      firstPayload.recommendation?.id,
    );
  });

  it("does not repeat the same configured package across three refreshes", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");

    const shownIds: string[] = [];

    for (const requestUrl of [
      "http://localhost/api/today-recommendation",
      "http://localhost/api/today-recommendation?refresh=1",
      "http://localhost/api/today-recommendation?refresh=1",
      "http://localhost/api/today-recommendation?refresh=1",
    ]) {
      const response = await getTodayRecommendation(new Request(requestUrl));
      const payload = (await response.json()) as {
        recommendation?: { id: string };
      };

      expect(response.status).toBe(200);
      expect(payload.recommendation?.id).toBeTruthy();
      shownIds.push(payload.recommendation!.id);
    }

    expect(generateTextJSONMock).not.toHaveBeenCalled();
    expect(new Set(shownIds.slice(1)).size).toBe(3);
    expect(new Set(shownIds).size).toBe(4);
  });

  it("uses 4am Asia Shanghai as the daily pool rollover time", () => {
    expect(
      todayRecommendationDateKey(new Date("2026-05-31T19:59:59.000Z")),
    ).toBe("2026-05-31");
    expect(
      todayRecommendationDateKey(new Date("2026-05-31T20:00:00.000Z")),
    ).toBe("2026-06-01");
  });
});
