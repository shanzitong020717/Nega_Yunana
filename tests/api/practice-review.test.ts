import { describe, expect, it } from "vitest";

import { POST as createReview } from "@/app/api/practice-sessions/[sessionId]/review/route";
import { POST as saveTranscript } from "@/app/api/practice-sessions/[sessionId]/transcript/route";

function jsonRequest(body?: unknown) {
  return new Request("http://localhost/api-test", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined
        ? undefined
        : {
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

describe("practice review API", () => {
  it("generates a structured review from a saved transcript", async () => {
    const sessionId = `session_review_${crypto.randomUUID()}`;
    const transcriptResponse = await saveTranscript(
      jsonRequest({
        turns: [
          {
            speaker: "ai_customer",
            text: "What business problem are you trying to solve with smart glasses?",
            timestamp: 0,
          },
          {
            speaker: "user",
            text: "We have translation function and it can help your meeting.",
            timestamp: 8,
          },
          {
            speaker: "ai_customer",
            text: "How does this fit into our existing workflow?",
            timestamp: 16,
          },
        ],
      }),
      routeContext(sessionId),
    );

    expect(transcriptResponse.status).toBe(201);

    const response = await createReview(jsonRequest(), routeContext(sessionId));
    expect(response.status).toBe(201);

    const payload = await readJson(response);
    expect(payload).toMatchObject({
      reviewId: expect.stringMatching(/^review_/),
      sessionId,
      meetingOutcome: {
        summary: expect.any(String),
      },
      scores: {
        clarity: {
          score: expect.any(Number),
          rationale: expect.any(String),
        },
      },
      sentenceUpgrades: expect.arrayContaining([
        expect.objectContaining({
          original: expect.stringContaining("translation function"),
          naturalEnglish: expect.any(String),
          chineseExplanation: expect.any(String),
          practicePrompt: expect.any(String),
        }),
      ]),
      materialCoverage: {
        covered: expect.any(Array),
        missed: expect.any(Array),
      },
      phrasebookSuggestions: expect.any(Array),
      weaknessUpdates: expect.any(Array),
      nextSessionRecommendation: {
        focus: expect.any(String),
      },
    });
  });
});
