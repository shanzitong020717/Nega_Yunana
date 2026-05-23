import { describe, expect, it } from "vitest";

import { GET as listPhrases } from "@/app/api/phrasebook/route";
import { POST as createReview } from "@/app/api/practice-sessions/[sessionId]/review/route";
import { POST as createSuggestedAnswer } from "@/app/api/practice-sessions/[sessionId]/suggested-answer/route";
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

describe("suggested answer API", () => {
  it("generates a context-aware answer, saves it to phrasebook, and carries it into review", async () => {
    const sessionId = `session_suggested_${crypto.randomUUID()}`;
    const transcriptTurns = [
      {
        speaker: "ai_customer" as const,
        text: "Can you detail how data is encrypted both at rest and in transit?",
        translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
        timestamp: 0,
        metadata: {},
      },
      {
        speaker: "user" as const,
        text: "Let me check with our team.",
        timestamp: 8,
        metadata: {},
      },
    ];
    const requestBody = {
      practiceSession: {
        scenarioPackId: "rokid-overseas-sales",
        goalId: "customer_qa",
        mode: "customer_qa",
        personaId: "technical_lead",
        voicePackId: "charon-informative",
        difficulty: "normal",
        trainingFocus: ["privacy and security"],
        focusTags: ["隐私安全"],
      },
      latestAiTurn: transcriptTurns[0],
      transcriptTurns,
    };

    const suggestionResponse = await createSuggestedAnswer(
      jsonRequest(requestBody),
      routeContext(sessionId),
    );
    expect(suggestionResponse.status).toBe(201);

    const suggestionPayload = await readJson(suggestionResponse);
    expect(suggestionPayload).toMatchObject({
      sessionId,
      suggestion: {
        id: expect.stringMatching(/^suggestion_/),
        aiQuestion: {
          english: expect.stringContaining("encrypted"),
          translationZh: expect.any(String),
        },
        analysis: expect.stringContaining("technical"),
        responseStrategy: {
          english: expect.any(String),
          chinese: expect.any(String),
        },
        logicBreakdown: {
          surfaceMeaningZh: expect.any(String),
          customerIntentZh: expect.any(String),
          informationNeededZh: expect.any(String),
          responseFocusZh: expect.any(String),
        },
        contextBreakdown: {
          conversationStateZh: expect.any(String),
          customerQuestionReasonZh: expect.any(String),
          priorUserAnswerZh: expect.stringContaining("Let me check"),
          missingInformationZh: expect.any(String),
          responseBoundaryZh: expect.any(String),
        },
        suggestedReplies: expect.arrayContaining([
          expect.objectContaining({
            english: expect.any(String),
            chinese: expect.any(String),
            reason: expect.any(String),
          }),
        ]),
        vocabulary: expect.arrayContaining([
          expect.objectContaining({
            term: expect.any(String),
            phonetic: expect.stringContaining("/"),
            chinese: expect.any(String),
          }),
        ]),
        phrasebookEntry: {
          source: "review",
          tags: expect.arrayContaining(["suggested-answer", "live-coaching"]),
        },
      },
    });
    const suggestion = suggestionPayload.suggestion as {
      suggestedReplies: Array<{ reason: string }>;
    };
    expect(suggestion.suggestedReplies[0]?.reason).not.toMatch(
      /[\u4e00-\u9fff]/,
    );

    const phrasesResponse = await listPhrases();
    const phrasesPayload = await readJson(phrasesResponse);
    expect(phrasesPayload.phrases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "review",
          tags: expect.arrayContaining(["suggested-answer"]),
        }),
      ]),
    );

    const transcriptResponse = await saveTranscript(
      jsonRequest({ turns: transcriptTurns }),
      routeContext(sessionId),
    );
    expect(transcriptResponse.status).toBe(201);

    const reviewResponse = await createReview(jsonRequest(), routeContext(sessionId));
    expect(reviewResponse.status).toBe(201);
    const reviewPayload = await readJson(reviewResponse);

    expect(reviewPayload.suggestedAnswers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aiQuestion: expect.objectContaining({
            english: expect.stringContaining("encrypted"),
          }),
          suggestedReplies: expect.arrayContaining([
            expect.objectContaining({
              english: expect.any(String),
            }),
          ]),
        }),
      ]),
    );
    expect(reviewPayload.phrasebookSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tags: expect.arrayContaining(["suggested-answer"]),
        }),
      ]),
    );
  });
});
