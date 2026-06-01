import { describe, expect, it } from "vitest";

import { POST as createReview } from "@/app/api/practice-sessions/[sessionId]/review/route";
import { GET as listWeaknesses } from "@/app/api/weaknesses/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api-test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

function routeContext(sessionId: string) {
  return {
    params: Promise.resolve({
      sessionId,
    }),
  };
}

const reviewBody = {
  meetingOutcome: {
    summary: "The meeting needs a clearer value story.",
    customerReaction: "Interested but cautious.",
    nextStep: "Run another technical buyer drill.",
  },
  scores: {
    clarity: { score: 4, rationale: "Clear enough." },
    businessConfidence: { score: 3, rationale: "Needs stronger value language." },
    discoverySkill: { score: 2, rationale: "Few discovery questions." },
    productPositioning: { score: 3, rationale: "Feature-heavy." },
    objectionHandling: { score: 3, rationale: "Safe but shallow." },
    englishNaturalness: { score: 3, rationale: "Understandable." },
  },
  topImprovements: [
    "Ask more discovery questions.",
    "Turn features into business value.",
    "Close with a next step.",
  ],
  bestMoments: ["Kept the answer safe."],
  sentenceUpgrades: [
    {
      status: "needs_upgrade",
      original: "We have translation function.",
      naturalEnglish:
        "Rokid supports real-time translated captions for multilingual customer meetings.",
      chineseExplanation: "把功能讲成客户会议价值。",
      practicePrompt: "Say it again with one customer benefit.",
    },
  ],
  materialCoverage: {
    covered: ["Real-time translated captions"],
    missed: ["Pilot success metrics"],
    unclear: ["Privacy data flow"],
  },
  phrasebookSuggestions: [],
  weaknessUpdates: [
    {
      type: "weak_discovery",
      severity: 4,
      evidence: "The learner answered before clarifying workflow.",
      recommendedDrill: "Use-case discovery ladder",
    },
  ],
  nextSessionRecommendation: {
    focus: "discovery questions",
    drill: "Ask two workflow questions before positioning.",
    prompt: "Ask about users, environment, and pilot success.",
  },
};

describe("weakness tracker", () => {
  it("updates weakness metrics when a review is created", async () => {
    const sessionId = `session_weakness_${crypto.randomUUID()}`;
    const reviewResponse = await createReview(
      jsonRequest(reviewBody),
      routeContext(sessionId),
    );
    expect(reviewResponse.status).toBe(201);

    const response = await listWeaknesses();
    const payload = await readJson(response);

    expect(payload).toMatchObject({
      recentTrainingCount: expect.any(Number),
      topWeaknesses: expect.arrayContaining([
        expect.objectContaining({
          type: "weak_discovery",
          evidence: "The learner answered before clarifying workflow.",
          recommendedDrill: "Use-case discovery ladder",
        }),
      ]),
      improvedWeaknesses: expect.any(Array),
      recommendedDrills: expect.arrayContaining(["Use-case discovery ladder"]),
      history: expect.arrayContaining([
        expect.objectContaining({
          sessionId,
          type: "weak_discovery",
        }),
      ]),
    });
  });
});
