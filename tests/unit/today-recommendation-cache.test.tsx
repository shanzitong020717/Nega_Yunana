import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TodayPracticeCard } from "@/features/dashboard/today-practice-card";
import {
  completeTodayRecommendationAndPrefetch,
  readTodayRecommendationCache,
  writeTodayRecommendationCache,
} from "@/lib/recommendations/today-recommendation-cache";
import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

const cachedRecommendation: TodayRecommendation = {
  id: "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
  title: "采购经理 · 竞品差异说明",
  reason: "这是当天已经生成过的推荐。",
  goalId: "competitive_differences",
  goalLabel: "竞品差异说明",
  personaId: "procurement_manager",
  personaLabel: "采购经理",
  voicePackId: "fenrir-excitable",
  voicePackLabel: "Fenrir 高能追问",
  materialMode: "memory_context",
  materialLabel: "系统记忆",
  durationMinutes: 8,
  href: "/practice",
  source: "ai",
  evidence: ["cached evidence"],
};

const refreshedRecommendation: TodayRecommendation = {
  id: "application_scenarios:enterprise_buyer:kore-firm:memory_context",
  title: "企业买家 · 应用场景说明",
  reason: "刷新后重新计算出的推荐。",
  goalId: "application_scenarios",
  goalLabel: "应用场景说明",
  personaId: "enterprise_buyer",
  personaLabel: "企业买家",
  voicePackId: "kore-firm",
  voicePackLabel: "Kore 坚定专业",
  materialMode: "memory_context",
  materialLabel: "系统记忆",
  durationMinutes: 10,
  href: "/practice",
  source: "ai",
  evidence: ["refreshed evidence"],
};

function recommendationResponse(recommendation: TodayRecommendation) {
  return new Response(JSON.stringify({ recommendation }), { status: 200 });
}

describe("today recommendation daily cache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("renders the saved daily recommendation immediately without reloading it", () => {
    const fetchMock = vi.fn().mockResolvedValue(
      recommendationResponse(refreshedRecommendation),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    render(<TodayPracticeCard />);

    expect(screen.getByText("采购经理 · 竞品差异说明")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /快速训练/ })).toHaveAttribute(
      "href",
      expect.stringContaining("recommendationId=competitive_differences"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes the recommendation package when the refresh button is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      recommendationResponse(refreshedRecommendation),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    render(<TodayPracticeCard />);

    fireEvent.click(screen.getByRole("button", { name: "刷新今日建议" }));

    expect(
      await screen.findByText("企业买家 · 应用场景说明"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/today-recommendation?"),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("refresh=1");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      `exclude=${encodeURIComponent(cachedRecommendation.id)}`,
    );
    expect(readTodayRecommendationCache()?.recommendation.title).toBe(
      "企业买家 · 应用场景说明",
    );
  });

  it("marks the completed quick practice package and preloads the next one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      recommendationResponse(refreshedRecommendation),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    await completeTodayRecommendationAndPrefetch(cachedRecommendation.id);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/today-recommendation?"),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("refresh=1");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      `exclude=${encodeURIComponent(cachedRecommendation.id)}`,
    );
    await waitFor(() => {
      expect(readTodayRecommendationCache()?.completedRecommendationIds).toContain(
        cachedRecommendation.id,
      );
    });
    expect(readTodayRecommendationCache()?.recommendation.title).toBe(
      "企业买家 · 应用场景说明",
    );
  });
});
