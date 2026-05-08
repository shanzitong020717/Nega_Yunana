import { describe, expect, it } from "vitest";

import { generatePrepCard } from "@/lib/ai/prep-card";

describe("generatePrepCard", () => {
  it("returns a structured mock prep card for a customer meeting", async () => {
    await expect(
      generatePrepCard({
        customerType: "Enterprise buyer",
        industry: "Healthcare",
        countryOrRegion: "Singapore",
        meetingGoal: "Qualify a pilot for multilingual meetings",
        knownConcerns: ["privacy", "translation accuracy"],
        trainingFocus: ["business value", "discovery questions"],
        materialBrief: {
          keyMessage: "Rokid supports real-time translated captions.",
          productPoints: ["Real-time translated captions"],
          customerValue: ["Reduce communication friction"],
          likelyQuestions: ["How accurate is translation?"],
          likelyObjections: ["How is meeting data handled?"],
          riskyClaims: ["Do not invent accuracy percentages."],
          usefulPhrases: ["May I first understand your use case?"],
          glossary: [],
          outline: ["Open with discovery."],
        },
        mockMode: true,
      }),
    ).resolves.toMatchObject({
      customerContext: expect.stringContaining("Singapore"),
      meetingGoal: "Qualify a pilot for multilingual meetings",
      keyTalkingPoints: expect.any(Array),
      discoveryQuestions: expect.any(Array),
      likelyObjections: expect.any(Array),
      openingScript: expect.any(String),
      mustUsePhrases: expect.any(Array),
      doNotOverpromise: expect.any(Array),
    });
  });
});
