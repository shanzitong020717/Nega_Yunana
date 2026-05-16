import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewView } from "@/features/reviews/review-view";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

const review: PracticeReviewPayload = {
  meetingOutcome: {
    summary: "The customer understood the core value but still needs workflow proof.",
    customerReaction: "Interested but technically cautious.",
    nextStep: "Set up a pilot discussion with IT.",
  },
  scores: {
    clarity: { score: 4, rationale: "Clear answer structure." },
    businessConfidence: { score: 3, rationale: "Needs stronger value language." },
    discoverySkill: { score: 3, rationale: "Asked one useful question." },
    productPositioning: { score: 4, rationale: "Connected captions to meetings." },
    objectionHandling: { score: 3, rationale: "Privacy answer was safe but brief." },
    englishNaturalness: { score: 3, rationale: "Understandable but feature-heavy." },
  },
  topImprovements: [
    "Turn features into business outcomes.",
    "Ask one discovery question before positioning.",
    "Close with a concrete next step.",
  ],
  bestMoments: [
    "You connected translation to multilingual meeting communication.",
  ],
  sentenceUpgrades: [
    {
      status: "needs_upgrade",
      original: "We have translation function.",
      naturalEnglish:
        "Rokid supports real-time translated captions, helping users follow multilingual conversations more smoothly.",
      chineseExplanation:
        "不要只说有翻译功能，要说明它如何帮助客户更顺畅地开会。",
      practicePrompt: "Explain this again in your own words.",
    },
    {
      status: "already_natural",
      original:
        "A practical next step would be to run a small pilot with one team.",
      positiveFeedback: "这句话已经自然、清楚，适合当前商务场景。",
      chineseExplanation: "这句话清楚表达了下一步。",
      practicePrompt: "Use this structure in another scenario.",
    },
  ],
  materialCoverage: {
    covered: ["Real-time translated captions"],
    missed: ["Pilot success metrics"],
    unclear: ["Privacy data flow"],
  },
  phrasebookSuggestions: [
    {
      category: "Business Value",
      english: "The key value is reducing communication friction in real time.",
      chinese: "核心价值是实时降低沟通阻力。",
      useCase: "Explain Rokid business value.",
      simpleVersion: undefined,
      professionalVersion: undefined,
      relatedProductPoint: undefined,
      relatedObjection: undefined,
      tags: ["business-value"],
      source: "review",
      masteryStatus: "needs_practice",
    },
  ],
  weaknessUpdates: [
    {
      type: "feature_only_talk",
      severity: 3,
      evidence: "The answer started with a feature instead of business value.",
      recommendedDrill: "Feature-to-value conversion drill",
    },
  ],
  memoryCandidates: [
    {
      type: "speaking_pattern",
      title: "Feature-first answering pattern",
      summary:
        "The learner tends to start with product features before explaining customer value.",
      sensitivity: "low",
      confidence: 0.84,
    },
  ],
  nextSessionRecommendation: {
    focus: "business value and privacy objection",
    drill: "Run a technical buyer Q&A.",
    prompt: "Explain privacy safely without inventing claims.",
  },
};

describe("ReviewView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the complete structured review experience", () => {
    render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

    [
      "30秒复盘结论",
      "会议结果",
      "商务评分卡",
      "前三个改进点",
      "表现最好的部分",
      "句子升级",
      "材料覆盖情况",
      "跟读练习",
      "表达库建议",
      "可沉淀记忆",
      "下一次练习建议",
    ].forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });

    expect(screen.getByText("原句")).toBeInTheDocument();
    expect(screen.getByText("更自然英文")).toBeInTheDocument();
    expect(screen.getByText("为什么更好")).toBeInTheDocument();
    expect(screen.getByText("肯定反馈")).toBeInTheDocument();
    expect(screen.getByText("做得好的原因")).toBeInTheDocument();
    expect(screen.getByText("这次最好的地方")).toBeInTheDocument();
    expect(screen.getByText("这次最需要改的地方")).toBeInTheDocument();
    expect(screen.getByText("下一次建议练什么")).toBeInTheDocument();
    expect(screen.getByText("Feature-first answering pattern")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存全部" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "逐条编辑" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "不保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存到表达库/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /听一遍/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /影子跟读/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重复练习/ })).toBeInTheDocument();
  });

  it("saves an upgraded sentence to the phrasebook and shows saved state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          phrase: {
            id: "phrase_123",
            english:
              "Rokid supports real-time translated captions, helping users follow multilingual conversations more smoothly.",
            source: "review",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

    fireEvent.click(screen.getByRole("button", { name: /保存到表达库/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/phrasebook",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(await screen.findByRole("button", { name: /已保存/ })).toBeDisabled();
  });

  it("saves, edits, and dismisses memory candidates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          memory: {
            id: "memory_123",
            title: "Feature-first answering pattern",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

    fireEvent.click(screen.getByRole("button", { name: "逐条编辑" }));
    expect(screen.getByLabelText("记忆标题")).toHaveValue(
      "Feature-first answering pattern",
    );
    fireEvent.change(screen.getByLabelText("记忆标题"), {
      target: { value: "Updated speaking pattern" },
    });

    fireEvent.click(screen.getByRole("button", { name: "保存全部" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/memories",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Updated speaking pattern"),
        }),
      );
    });
    expect(await screen.findByText("已保存 1 条记忆。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "不保存" }));
    expect(screen.queryByText("Feature-first answering pattern")).not.toBeInTheDocument();
  });
});
