import { afterEach, describe, expect, it, vi } from "vitest";

const parseResponseMock = vi.fn();

vi.mock("@/lib/ai/openai-client", () => ({
  hasOpenAIApiKey: () => Boolean(process.env.OPENAI_API_KEY?.trim()),
  getOpenAIClient: () => ({
    responses: {
      parse: parseResponseMock,
    },
  }),
}));

import { generatePrepCard } from "@/lib/ai/prep-card";

describe("generatePrepCard", () => {
  afterEach(() => {
    parseResponseMock.mockReset();
    vi.unstubAllEnvs();
  });

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

  it("falls back to a usable prep card when OpenAI generation fails", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    parseResponseMock.mockRejectedValueOnce(new Error("OpenAI unavailable"));

    await expect(
      generatePrepCard({
        customerType: "Enterprise buyer",
        industry: "Healthcare",
        countryOrRegion: "Singapore",
        meetingGoal: "Qualify a pilot for multilingual meetings",
        knownConcerns: ["privacy"],
        trainingFocus: ["business value"],
      }),
    ).resolves.toMatchObject({
      customerContext: expect.stringContaining("Singapore"),
      meetingGoal: "Qualify a pilot for multilingual meetings",
      keyTalkingPoints: expect.any(Array),
      discoveryQuestions: expect.any(Array),
    });
    expect(parseResponseMock).toHaveBeenCalledTimes(1);
  });

  it("uses structured OpenAI output when the API is configured", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    parseResponseMock.mockResolvedValueOnce({
      output_parsed: {
        customerContext: "Enterprise buyer in Singapore.",
        meetingGoal: "Qualify a pilot for multilingual meetings",
        keyTalkingPoints: ["Connect the demo to workflow value."],
        discoveryQuestions: ["What would a successful pilot prove?"],
        likelyObjections: ["How is meeting data handled?"],
        openingScript: "May I first understand your use case?",
        mustUsePhrases: ["The key value is reducing communication friction."],
        doNotOverpromise: ["Do not invent accuracy percentages."],
      },
    });

    await expect(
      generatePrepCard({
        customerType: "Enterprise buyer",
        industry: "Healthcare",
        countryOrRegion: "Singapore",
        meetingGoal: "Qualify a pilot for multilingual meetings",
        knownConcerns: ["privacy"],
        trainingFocus: ["business value"],
      }),
    ).resolves.toMatchObject({
      customerContext: "Enterprise buyer in Singapore.",
      keyTalkingPoints: ["Connect the demo to workflow value."],
    });
    expect(parseResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: "json_schema",
          }),
        }),
      }),
    );
  });
});
