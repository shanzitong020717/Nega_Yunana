import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProgressView } from "@/features/progress/progress-view";
import type { ProgressSummary } from "@/lib/progress/weakness-store";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

const progress: ProgressSummary = {
  recentTrainingCount: 2,
  topWeaknesses: [],
  improvedWeaknesses: [],
  recommendedDrills: [],
  history: [],
};

const analytics: ReviewAnalyticsSnapshot = {
  id: "review_analytics_7d",
  range: "7d",
  generatedAt: "2026-05-24T09:00:00.000Z",
  staleAfter: "2026-05-24T23:59:59.999Z",
  sourceReviewIds: ["review_1", "review_2"],
  sourceSessionIds: ["session_1", "session_2"],
  trainingCount: 2,
  summaryZh:
    "近 7 天你能说明业务价值，但隐私与部署回答仍然偏长，需要更清晰地推进下一步。",
  topGrowthSignals: [
    {
      id: "growth_business_value",
      title: "业务价值表达更清楚",
      summaryZh: "你开始把 Rokid 连接到多语言会议效率。",
      evidence: ["Rokid makes multilingual meetings easier to follow."],
      confidence: 0.82,
    },
  ],
  recurringMistakes: [
    {
      id: "mistake_word_choice",
      category: "word_choice",
      title: "直译式功能表达",
      occurrenceCount: 2,
      averageSeverity: 3,
      lastSeenAt: "2026-05-24T08:00:00.000Z",
      examples: [
        {
          reviewId: "review_1",
          sessionId: "session_1",
          original: "We have translation function.",
          correction: "real-time translated captions",
          explanationZh: "用具体产品能力替代直译。",
        },
      ],
      recommendedDrill: "功能转价值练习",
    },
  ],
  naturalnessPatterns: [],
  phraseGrowth: {
    newPhraseCount: 2,
    reviewGeneratedPhraseCount: 2,
    vocabularyItems: [
      {
        term: "multilingual meetings",
        chinese: "多语言会议",
        example: "Rokid makes multilingual meetings easier to follow.",
        count: 2,
      },
    ],
    reusableSentences: [
      {
        english:
          "We can start with a focused pilot and involve your IT team early.",
        chinese:
          "我们可以先从聚焦试点开始，并尽早让 IT 团队参与。",
        useCase: "回应试点与隐私安全。",
      },
    ],
  },
  memoryInsights: [],
  nextTrainingPlan: {
    title: "技术负责人 · 隐私与部署推进",
    reasonZh: "隐私和部署回答偏长，适合练习短回答。",
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

describe("ProgressView long-term review analytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders long-term analytics sections and range tabs", () => {
    render(<ProgressView progress={progress} analytics={analytics} />);

    expect(screen.getByText("长期复盘")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 7 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全部时间" })).toBeInTheDocument();
    expect(screen.getByText("直译式功能表达")).toBeInTheDocument();
    expect(screen.getByText("业务价值表达更清楚")).toBeInTheDocument();
    expect(screen.getByText("multilingual meetings")).toBeInTheDocument();
    expect(screen.getByText("技术负责人 · 隐私与部署推进")).toBeInTheDocument();
  });

  it("refreshes analytics through the backend API", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          analytics: {
            ...analytics,
            summaryZh: "刷新后的长期复盘总结。",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ProgressView progress={progress} analytics={analytics} />);
    fireEvent.click(screen.getByRole("button", { name: "重新计算" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/review-analytics",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(await screen.findByText("刷新后的长期复盘总结。")).toBeInTheDocument();
  });

  it("renders an empty state when there is not enough review history", () => {
    render(<ProgressView progress={progress} analytics={null} />);

    expect(screen.getByText("完成 2 次以上练习后，系统会生成长期趋势复盘。"))
      .toBeInTheDocument();
  });
});
