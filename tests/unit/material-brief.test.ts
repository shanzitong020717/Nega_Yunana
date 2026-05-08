import { describe, expect, it } from "vitest";

import { generateMaterialBrief } from "@/lib/ai/material-brief";

describe("generateMaterialBrief", () => {
  it("returns a structured mock brief without calling OpenAI", async () => {
    await expect(
      generateMaterialBrief({
        materialName: "Rokid multilingual meeting notes",
        customerType: "Enterprise buyer",
        industry: "Healthcare",
        meetingGoal: "Qualify a pilot",
        notes: "Focus on privacy and IT review.",
        extractedText:
          "Rokid Glasses support real-time translated captions and hands-free access to meeting information.",
        mockMode: true,
      }),
    ).resolves.toMatchObject({
      keyMessage: expect.stringContaining("Rokid multilingual meeting notes"),
      productPoints: expect.any(Array),
      customerValue: expect.any(Array),
      likelyQuestions: expect.any(Array),
      likelyObjections: expect.any(Array),
      riskyClaims: expect.any(Array),
      usefulPhrases: expect.any(Array),
      glossary: expect.any(Array),
      outline: expect.any(Array),
    });
  });
});
