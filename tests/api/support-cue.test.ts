import { describe, expect, it } from "vitest";

import { POST as createSmartGuidance } from "@/app/api/practice-sessions/[sessionId]/smart-guidance/route";
import { POST as createSupportCue } from "@/app/api/practice-sessions/[sessionId]/support-cue/route";

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

describe("support cue API", () => {
  const practiceSession = {
    scenarioPackId: "rokid-overseas-sales",
    goalId: "customer_qa",
    mode: "customer_qa",
    personaId: "technical_lead",
    voicePackId: "charon-informative",
    difficulty: "normal",
    trainingFocus: ["deployment options", "security review"],
    focusTags: ["技术与部署", "隐私安全"],
  };
  const transcriptTurns = [
    {
      speaker: "ai_customer" as const,
      text: "Can you clarify the deployment options? Cloud or on-premise?",
      timestamp: 0,
      metadata: {},
    },
    {
      speaker: "user" as const,
      text: "We can help translate meetings and make communication better.",
      timestamp: 8,
      metadata: {},
    },
  ];

  it("generates a context-aware better phrase support cue with vocabulary", async () => {
    const response = await createSupportCue(
      jsonRequest({
        cue: "Better Phrase",
        practiceSession,
        transcriptTurns,
      }),
      routeContext("session_support_cue"),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      sessionId: "session_support_cue",
      cueResult: {
        title: "更自然表达分析",
        sections: expect.arrayContaining([
          expect.objectContaining({
            label: "AI 客户上下文",
            english: expect.stringContaining("deployment options"),
          }),
          expect.objectContaining({
            label: "客户角色",
            chinese: expect.stringContaining("技术负责人"),
          }),
          expect.objectContaining({
            label: "更自然表达",
            english: expect.stringContaining("technical review"),
            chinese: expect.any(String),
          }),
        ]),
        vocabulary: expect.arrayContaining([
          expect.objectContaining({
            term: expect.any(String),
            phonetic: expect.stringContaining("/"),
            chinese: expect.any(String),
          }),
          expect.objectContaining({
            term: expect.any(String),
            phonetic: expect.stringContaining("/"),
            chinese: expect.any(String),
          }),
        ]),
      },
    });
  });

  it("generates realtime smart guidance from the current transcript context", async () => {
    const response = await createSmartGuidance(
      jsonRequest({
        practiceSession,
        transcriptTurns,
      }),
      routeContext("session_smart_guidance_ai"),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      sessionId: "session_smart_guidance_ai",
      guidance: {
        currentJudgment: expect.stringContaining("部署"),
        nextStep: expect.any(String),
        sayThis: expect.any(String),
      },
    });
  });
}
);
