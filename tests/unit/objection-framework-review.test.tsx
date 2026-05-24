import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { personas } from "@/data/personas";
import { ReviewView } from "@/features/reviews/review-view";
import { generatePracticeReview } from "@/lib/ai/review";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

const baseReview: PracticeReviewPayload = {
  meetingOutcome: {
    summary: "The answer handled the objection safely but missed structure.",
    customerReaction: "Still skeptical.",
    nextStep: "Practice the objection framework.",
  },
  scores: {
    clarity: { score: 3, rationale: "Understandable." },
    businessConfidence: { score: 3, rationale: "Needs more confident positioning." },
    discoverySkill: { score: 2, rationale: "No clarifying question." },
    productPositioning: { score: 3, rationale: "Some positioning." },
    objectionHandling: { score: 2, rationale: "Missing framework steps." },
    englishNaturalness: { score: 3, rationale: "Natural enough." },
  },
  topImprovements: [
    "Acknowledge the concern.",
    "Ask a clarifying question.",
    "Close with a next step.",
  ],
  bestMoments: ["The answer did not overclaim."],
  sentenceReviews: [],
  sentenceUpgrades: [],
  materialCoverage: {
    covered: [],
    missed: [],
    unclear: [],
  },
  phrasebookSuggestions: [],
  weaknessUpdates: [],
  memoryCandidates: [],
  nextSessionRecommendation: {
    focus: "objection handling",
    drill: "Acknowledge, clarify, position, support, next step.",
    prompt: "Answer the phone-app objection using all five steps.",
  },
  objectionFramework: {
    requiredSteps: ["Acknowledge", "Clarify", "Position", "Support", "Next Step"],
    usedSteps: ["Acknowledge", "Position", "Support"],
    missingSteps: ["Clarify", "Next Step"],
    coachingNote:
      "Add a clarifying question and close with a concrete pilot or workflow next step.",
  },
};

describe("objection handling framework review", () => {
  it("detects missing objection framework steps in generated reviews", async () => {
    const review = await generatePracticeReview({
      practiceSession: {
        id: "session_objection_123",
        scenarioPackId: "rokid-overseas-sales",
        goalId: "objection_handling",
        mode: "objection_challenge",
        personaId: "skeptical_executive",
        voicePackId: "fenrir-excitable",
        materialId: undefined,
        prepCardId: undefined,
        difficulty: "normal",
        trainingFocus: ["objection_handling"],
        focusTags: ["异议处理"],
        sourceObjectionId: "product-value-phone-app",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Why not just use a phone translation app?",
          timestamp: 0,
          metadata: {},
        },
        {
          speaker: "user",
          text: "That is a fair question. Rokid is designed for hands-free real-time communication and we can test it in a pilot.",
          timestamp: 8,
          metadata: {},
        },
      ],
      persona: personas.find((persona) => persona.id === "skeptical_executive")!,
      mockMode: true,
    });

    expect(review.objectionFramework).toMatchObject({
      requiredSteps: ["Acknowledge", "Clarify", "Position", "Support", "Next Step"],
      usedSteps: expect.arrayContaining(["Acknowledge", "Position", "Support"]),
      missingSteps: expect.arrayContaining(["Clarify", "Next Step"]),
    });
  });

  it("shows missing objection framework steps in the review page", () => {
    render(<ReviewView reviewId="review_123" sessionId="session_123" review={baseReview} />);

    expect(screen.getByText("异议处理框架")).toBeInTheDocument();
    expect(screen.getByText("缺少：澄清背景, 推进下一步")).toBeInTheDocument();
    expect(screen.getByText(baseReview.objectionFramework!.coachingNote)).toBeInTheDocument();
  });
});
