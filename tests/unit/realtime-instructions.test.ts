import { describe, expect, it } from "vitest";

import { defaultScenarioPack } from "@/data/scenario-packs";
import {
  buildRealtimeInstructions,
  resolveGeminiLiveVoiceName,
} from "@/lib/ai/realtime";

describe("buildRealtimeInstructions", () => {
  it("combines scenario, goal, persona, voice pack, materials, memory, and focus tags", () => {
    const practiceGoal = defaultScenarioPack.practiceGoals.find(
      (goal) => goal.id === "customer_qa",
    );
    const voicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "charon-informative",
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
        rolePrompt: "Act as a technical lead and probe product parameters.",
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
    expect(instructions).toContain("Voice pack: Charon 清晰信息型");
    expect(instructions).toContain("Voice gender: male");
    expect(instructions).toContain("Voice intent: Gemini AI Studio voice_name=Charon");
    expect(instructions).toContain(
      "Customer role prompt: Act as a technical lead and probe product parameters.",
    );
    expect(instructions).toContain("Realtime voice provider: Gemini Live");
    expect(instructions).toContain(
      "Do not call DeepSeek during the active realtime audio loop",
    );
    expect(instructions).toContain(
      "Memory snippets are loaded before the live session starts",
    );
    expect(instructions).toContain("Rokid supports real-time translated captions.");
    expect(instructions).toContain("Technical lead in healthcare.");
    expect(instructions).toContain("business value");
    expect(instructions).toContain("应用场景说明");
    expect(instructions).toContain(
      "The learner often explains features before confirming customer scenarios.",
    );
    expect(instructions).toContain("Conversation opening strategy:");
    expect(instructions).toContain("Start like a real business meeting");
    expect(instructions).toContain(
      "Do not begin with detailed objections, technical audit, pricing, ROI, security, or deployment questions.",
    );
    expect(instructions).toContain(
      "Turn 1 should be a natural greeting, meeting-context check, or invitation for the learner to introduce the topic.",
    );
    expect(instructions).toContain(
      "Only after context is established should you escalate into persona-specific detailed questions.",
    );
    expect(instructions).toContain("Do not invent product claims");
  });

  it("maps voice packs to supported Gemini Live voice names", () => {
    const technicalVoicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "charon-informative",
    );
    const friendlyBuyerVoicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "zephyr-bright",
    );
    const enterpriseVoicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "kore-firm",
    );
    const procurementVoicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "leda-youthful",
    );

    expect(resolveGeminiLiveVoiceName(technicalVoicePack)).toBe("Charon");
    expect(resolveGeminiLiveVoiceName(friendlyBuyerVoicePack)).toBe("Zephyr");
    expect(resolveGeminiLiveVoiceName(enterpriseVoicePack)).toBe("Kore");
    expect(resolveGeminiLiveVoiceName(procurementVoicePack)).toBe("Leda");
    expect(resolveGeminiLiveVoiceName(null)).toBe("Puck");
  });

  it("includes the selected practice scenario guidance in realtime instructions", () => {
    const practiceGoal = defaultScenarioPack.practiceGoals.find(
      (goal) => goal.id === "product_parameters",
    );
    const voicePack = defaultScenarioPack.voicePacks.find(
      (item) => item.id === "charon-informative",
    );

    const instructions = buildRealtimeInstructions({
      scenarioPack: defaultScenarioPack,
      practiceGoal,
      voicePack,
      mode: "customer_qa",
      persona: {
        id: "technical_lead",
        name: "Technical Lead",
        focusAreas: ["parameters", "integration"],
        tone: "Detail-oriented.",
        sampleQuestions: [],
        rolePrompt: "Act as a technical lead.",
      },
      focusTags: practiceGoal?.defaultFocusTags,
      trainingFocus: practiceGoal?.defaultFocusTags,
    });

    expect(instructions).toContain("Practice goal: 产品参数解释");
    expect(instructions).toContain("Practice opening hint:");
    expect(instructions).toContain("Scenario question guidance:");
    expect(instructions).toContain(
      "Ask how a parameter changes customer workflow, not only what the parameter is.",
    );
    expect(instructions).toContain("Scenario review dimensions:");
    expect(instructions).toContain("参数解释清晰度");
  });
});
