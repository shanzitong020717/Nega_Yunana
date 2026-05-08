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
      original: "We have translation function.",
      naturalEnglish:
        "Rokid supports real-time translated captions, helping users follow multilingual conversations more smoothly.",
      chineseExplanation:
        "不要只说有翻译功能，要说明它如何帮助客户更顺畅地开会。",
      practicePrompt: "Explain this again in your own words.",
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
      "Meeting Outcome",
      "Business Scorecard",
      "Top 3 Improvements",
      "Best Moments",
      "Sentence Upgrade",
      "Material Coverage",
      "Replay Practice",
      "Phrasebook Suggestions",
      "Next Session Recommendation",
    ].forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });

    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Natural Business English")).toBeInTheDocument();
    expect(screen.getByText("中文解释")).toBeInTheDocument();
    expect(screen.getByText("Practice Prompt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save to Phrasebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Listen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Shadow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Repeat/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Save to Phrasebook/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/phrasebook",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(await screen.findByRole("button", { name: /Saved/i })).toBeDisabled();
  });
});
