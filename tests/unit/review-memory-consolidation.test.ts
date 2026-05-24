import { describe, expect, it } from "vitest";

import { consolidateReviewMemoryCandidates } from "@/lib/memory/review-memory-consolidation";
import { listMemories } from "@/lib/memory/memory-store";
import type { ReviewRecord } from "@/lib/practice/practice-session-store";

function reviewWithCandidates(
  id: string,
  candidates: ReviewRecord["memoryCandidates"],
): ReviewRecord {
  return {
    id,
    sessionId: `session_${id}`,
    createdAt: "2026-05-24T08:00:00.000Z",
    updatedAt: "2026-05-24T08:00:00.000Z",
    meetingOutcome: {
      summary: "Summary",
      customerReaction: "Interested",
      nextStep: "Continue",
    },
    scores: {
      clarity: { score: 3, rationale: "Clear." },
      businessConfidence: { score: 3, rationale: "Okay." },
      discoverySkill: { score: 3, rationale: "Okay." },
      productPositioning: { score: 3, rationale: "Okay." },
      objectionHandling: { score: 3, rationale: "Okay." },
      englishNaturalness: { score: 3, rationale: "Okay." },
    },
    topImprovements: ["Improve"],
    bestMoments: ["Good"],
    sentenceReviews: [],
    sentenceUpgrades: [],
    suggestedAnswers: [],
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [],
    weaknessUpdates: [],
    memoryCandidates: candidates,
    nextSessionRecommendation: {
      focus: "Focus",
      drill: "Drill",
      prompt: "Prompt",
    },
  };
}

describe("consolidateReviewMemoryCandidates", () => {
  it("creates low-sensitivity enabled review memories and skips high-sensitivity candidates", () => {
    const title = `Unique low sensitivity pattern ${crypto.randomUUID()}`;
    const result = consolidateReviewMemoryCandidates(
      reviewWithCandidates("review_memory_create", [
        {
          type: "speaking_pattern",
          title,
          summary: "Learner answers privacy questions too generally.",
          evidence: ["I think privacy is okay."],
          sensitivity: "low",
          confidence: 0.78,
          importance: 4,
          enabledForAi: true,
        },
        {
          type: "customer_context",
          title: "Confidential hospital customer",
          summary: "Contains customer-sensitive material.",
          evidence: ["Customer name"],
          sensitivity: "high",
          confidence: 0.9,
          importance: 5,
          enabledForAi: true,
        },
      ]),
    );

    expect(result.created).toHaveLength(1);
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "high_sensitivity",
        }),
      ]),
    );
    expect(listMemories().some((memory) => memory.title === title)).toBe(true);
  });

  it("merges candidates with an existing similar review memory", () => {
    const result = consolidateReviewMemoryCandidates(
      reviewWithCandidates("review_memory_merge", [
        {
          type: "speaking_pattern",
          title: "Feature-first answering pattern",
          summary:
            "The learner again started with product functions before explaining workflow value.",
          evidence: ["We have translation function."],
          sensitivity: "low",
          confidence: 0.9,
          importance: 5,
          enabledForAi: true,
        },
      ]),
    );

    expect(result.merged[0]).toMatchObject({
      title: "Feature-first answering pattern",
      source: "review",
      importance: 5,
      enabledForAi: true,
    });
    expect(result.created).toHaveLength(0);
  });
});
