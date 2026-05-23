import { describe, expect, it } from "vitest";

import { getTodayRecommendation } from "@/lib/recommendations/today-recommendation";

describe("today practice recommendation", () => {
  it("builds the default recommendation for the daily practice card", () => {
    const recommendation = getTodayRecommendation();

    expect(recommendation.title).toMatch(/技术负责人|隐私与部署异议/);
    expect(recommendation.reason).toContain("推荐");
    expect(recommendation.durationMinutes).toBeGreaterThanOrEqual(8);
    expect(recommendation.durationMinutes).toBeLessThanOrEqual(15);
    expect(recommendation.href).toBe("/practice");
    expect(recommendation.materialLabel).toBeTruthy();
    expect(recommendation.personaLabel).toBe("技术负责人");
    expect(recommendation.voicePackLabel).toBe("Kore 坚定专业");
  });
});
