import { describe, expect, it } from "vitest";

import { buildRealtimeInstructions } from "@/lib/ai/realtime";

describe("buildRealtimeInstructions", () => {
  it("combines persona, material brief, prep card, and training focus", () => {
    const instructions = buildRealtimeInstructions({
      mode: "customer_qa",
      persona: {
        id: "technical_lead",
        name: "Technical Lead",
        focusAreas: ["security", "integration"],
        tone: "Detail-oriented and technically skeptical.",
        sampleQuestions: ["How does this fit into our workflow?"],
      },
      materialBrief: {
        keyMessage: "Rokid supports real-time translated captions.",
        productPoints: ["Real-time translated captions"],
        customerValue: ["Reduce communication friction"],
        likelyQuestions: ["How accurate is the translation?"],
        likelyObjections: ["How is meeting data handled?"],
        riskyClaims: ["Do not invent accuracy percentages."],
        usefulPhrases: ["May I first understand your use case?"],
        glossary: [],
        outline: ["Open with discovery."],
      },
      prepCard: {
        customerContext: "Technical lead in healthcare.",
        meetingGoal: "Prepare a solution meeting",
        keyTalkingPoints: ["Connect translation to workflow value."],
        discoveryQuestions: ["What does a successful pilot look like?"],
        likelyObjections: ["Privacy review"],
        openingScript: "May I first understand your use case?",
        mustUsePhrases: ["Reduce communication friction in real time."],
        doNotOverpromise: ["Do not invent pricing."],
      },
      trainingFocus: ["business value", "privacy objection"],
    });

    expect(instructions).toContain("Technical Lead");
    expect(instructions).toContain("Rokid supports real-time translated captions.");
    expect(instructions).toContain("Technical lead in healthcare.");
    expect(instructions).toContain("business value");
    expect(instructions).toContain("Do not invent product claims");
  });
});
