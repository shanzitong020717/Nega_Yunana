import { describe, expect, it } from "vitest";

import { defaultScenarioPack } from "@/data/scenario-packs";
import { buildRealtimeInstructions } from "@/lib/ai/realtime";

describe("buildRealtimeInstructions", () => {
  it("combines scenario, goal, persona, voice pack, materials, memory, and focus tags", () => {
    const practiceGoal = defaultScenarioPack.practiceGoals.find(
      (goal) => goal.id === "customer_qa",
    );
    const voicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "ethan-technical-lead",
    );
    const instructions = buildRealtimeInstructions({
      scenarioPack: defaultScenarioPack,
      practiceGoal,
      voicePack,
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
        meetingGoal: "Prepare a solution meeting",
        keyTalkingPoints: ["Connect translation to workflow value."],
        discoveryQuestions: ["What does a successful pilot look like?"],
        likelyObjections: ["Privacy review"],
        openingScript: "May I first understand your use case?",
        mustUsePhrases: ["Reduce communication friction in real time."],
        doNotOverpromise: ["Do not invent pricing."],
      },
      trainingFocus: ["business value", "privacy objection"],
      focusTags: ["应用场景说明", "产品参数解释"],
      memorySnippets: [
        "The learner often explains features before confirming customer scenarios.",
      ],
    });

    expect(instructions).toContain("Scenario pack: Rokid 海外商务会谈");
    expect(instructions).toContain("Practice goal: 客户问答");
    expect(instructions).toContain("Technical Lead");
    expect(instructions).toContain("Voice pack: Ethan 技术负责人");
    expect(instructions).toContain("Voice intent: steady_technical_male");
    expect(instructions).toContain("Rokid supports real-time translated captions.");
    expect(instructions).toContain("Technical lead in healthcare.");
    expect(instructions).toContain("business value");
    expect(instructions).toContain("应用场景说明");
    expect(instructions).toContain(
      "The learner often explains features before confirming customer scenarios.",
    );
    expect(instructions).toContain("Do not invent product claims");
  });
});
