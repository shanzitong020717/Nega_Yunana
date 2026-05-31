import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TodayPracticeCard } from "@/features/dashboard/today-practice-card";
import {
  completeTodayRecommendationAndPrefetch,
  millisecondsUntilNextTodayRecommendationRollover,
  readTodayRecommendationCache,
  todayRecommendationCacheKey,
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("keeps the previous daily cache before 4am and switches at 4am", () => {
    expect(
      todayRecommendationCacheKey(new Date(2026, 4, 31, 3, 59, 59)),
    ).toBe("today-recommendation:2026-05-30");
    expect(todayRecommendationCacheKey(new Date(2026, 4, 31, 4, 0, 0))).toBe(
      "today-recommendation:2026-05-31",
    );
  });

  it("calculates the next automatic dashboard rollover at 4am", () => {
    expect(
      millisecondsUntilNextTodayRecommendationRollover(
        new Date(2026, 4, 31, 3, 59, 30),
      ),
    ).toBe(30_000);
    expect(
      millisecondsUntilNextTodayRecommendationRollover(
        new Date(2026, 4, 31, 4, 1, 0),
      ),
    ).toBe(86_340_000);
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

  it("switches to the next preloaded recommendation package when refresh is clicked", async () => {
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
      "/api/today-recommendation?refresh=1",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(readTodayRecommendationCache()?.recommendation.title).toBe(
      "企业买家 · 应用场景说明",
    );
  });

  it("keeps refresh as a simple next-package switch across repeated clicks", async () => {
    const thirdRecommendation: TodayRecommendation = {
      id: "demo_narration:channel_partner:zephyr-bright:memory_context",
      title: "渠道合作伙伴 · 产品演示讲解",
      reason: "第二次刷新后重新计算出的推荐。",
      goalId: "demo_narration",
      goalLabel: "产品演示讲解",
      personaId: "channel_partner",
      personaLabel: "渠道合作伙伴",
      voicePackId: "zephyr-bright",
      voicePackLabel: "Zephyr 明亮友好",
      materialMode: "memory_context",
      materialLabel: "系统记忆",
      durationMinutes: 10,
      href: "/practice",
      source: "ai",
      evidence: ["third evidence"],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(recommendationResponse(refreshedRecommendation))
      .mockResolvedValueOnce(recommendationResponse(thirdRecommendation));
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    render(<TodayPracticeCard />);

    fireEvent.click(screen.getByRole("button", { name: "刷新今日建议" }));
    expect(
      await screen.findByText("企业买家 · 应用场景说明"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "刷新今日建议" }));
    expect(
      await screen.findByText("渠道合作伙伴 · 产品演示讲解"),
    ).toBeInTheDocument();

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/today-recommendation?refresh=1",
      "/api/today-recommendation?refresh=1",
    ]);
    expect(readTodayRecommendationCache()?.shownRecommendationIds).toEqual([
      cachedRecommendation.id,
      refreshedRecommendation.id,
      thirdRecommendation.id,
    ]);
  });

  it("marks the completed quick practice package and preloads the next one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      recommendationResponse(refreshedRecommendation),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    await completeTodayRecommendationAndPrefetch(cachedRecommendation.id);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/today-recommendation?refresh=1",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
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

  it("automatically loads the new daily package after the 4am rollover", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 31, 3, 59, 59));

    const fetchMock = vi.fn().mockResolvedValue(
      recommendationResponse(refreshedRecommendation),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeTodayRecommendationCache(cachedRecommendation);

    render(<TodayPracticeCard />);

    expect(screen.getByText("采购经理 · 竞品差异说明")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(screen.getByText("企业买家 · 应用场景说明")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/today-recommendation",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(readTodayRecommendationCache()?.recommendation.title).toBe(
      "企业买家 · 应用场景说明",
    );
  });
});
