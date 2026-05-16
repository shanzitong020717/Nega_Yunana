import { describe, expect, it } from "vitest";

import { personas } from "@/data/personas";
import { generatePracticeReview } from "@/lib/ai/review";

const transcriptTurns = [
  {
    speaker: "ai_customer" as const,
    text: "What business problem are you trying to solve with smart glasses?",
    timestamp: 0,
    metadata: {},
  },
  {
    speaker: "user" as const,
    text: "We have translation function and it can help your meeting.",
    timestamp: 8,
    metadata: {},
  },
  {
    speaker: "ai_customer" as const,
    text: "How does this fit into our existing workflow?",
    timestamp: 16,
    metadata: {},
  },
  {
    speaker: "user" as const,
    text: "You can use it for pilot and review privacy later.",
    timestamp: 24,
    metadata: {},
  },
];

describe("generatePracticeReview", () => {
  it("returns a validated structured review with scorecard, sentence upgrades, and learning assets", async () => {
    const review = await generatePracticeReview({
      practiceSession: {
        id: "session_123",
        scenarioPackId: "rokid-overseas-sales",
        goalId: "customer_qa",
        mode: "customer_qa",
        personaId: "technical_lead",
        voicePackId: "ethan-technical-lead",
        materialId: "material_123",
        prepCardId: "prep_123",
        difficulty: "normal",
        trainingFocus: ["business value", "privacy objection"],
        focusTags: ["商业价值", "隐私安全"],
        sourceObjectionId: undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      transcriptTurns,
      persona: personas.find((persona) => persona.id === "technical_lead")!,
      materialBrief: {
        keyMessage: "Rokid supports real-time translated captions.",
        productPoints: ["Real-time translated captions"],
        customerValue: ["Reduce communication friction"],
        likelyQuestions: ["How accurate is the translation?"],
        applicationScenarios: ["Overseas customer meetings"],
        pros: ["Hands-free captions"],
        cons: ["Needs IT review"],
        competitorDifferences: ["More meeting-focused than phone apps"],
        productParameters: ["Define pilot users and language pairs"],
        memoryStatus: "session_only",
        likelyObjections: ["How is meeting data handled?"],
        riskyClaims: ["Do not invent accuracy percentages."],
        usefulPhrases: ["May I first understand your use case?"],
        glossary: [],
        outline: ["Open with discovery."],
      },
      prepCard: {
        customerContext: "Technical lead in healthcare.",
        meetingGoal: "Qualify a pilot",
        keyTalkingPoints: ["Connect translation to workflow value."],
        discoveryQuestions: ["What does a successful pilot look like?"],
        likelyObjections: ["Privacy review"],
        openingScript: "May I first understand your use case?",
        mustUsePhrases: ["Reduce communication friction in real time."],
        doNotOverpromise: ["Do not invent pricing."],
      },
      mockMode: true,
    });

    expect(review.meetingOutcome.summary).toContain("Technical Lead");
    expect(review.scores.clarity.score).toBeGreaterThanOrEqual(1);
    expect(review.topImprovements).toHaveLength(3);
    expect(review.sentenceUpgrades[0]).toMatchObject({
      original: expect.stringContaining("translation function"),
      naturalEnglish: expect.stringContaining("real-time translated captions"),
      chineseExplanation: expect.any(String),
      practicePrompt: expect.any(String),
    });
    expect(review.materialCoverage.covered).toContain("Real-time translated captions");
    expect(review.phrasebookSuggestions[0]).toMatchObject({
      source: "review",
      masteryStatus: "needs_practice",
    });
    expect(review.weaknessUpdates[0]).toMatchObject({
      type: expect.any(String),
      severity: expect.any(Number),
    });
    expect(review.nextSessionRecommendation.focus).toContain("business value");
  });
});
