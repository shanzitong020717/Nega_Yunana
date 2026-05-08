import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as createRealtimeSession } from "@/app/api/realtime/session/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/realtime/session", {
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

describe("realtime session API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns browser-safe realtime credentials without exposing the standard API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-standard-secret");
    vi.stubEnv("AI_MOCK_MODE", "true");

    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: "session_123",
        personaId: "technical_lead",
        materialId: "material_123",
        mode: "customer_qa",
        trainingFocus: ["business value"],
      }),
    );

    expect(response.status).toBe(201);
    const payload = await readJson(response);
    const serializedPayload = JSON.stringify(payload);

    expect(payload).toMatchObject({
      clientSecret: expect.stringMatching(/^mock_realtime_client_secret_/),
      sessionId: expect.stringMatching(/^rt_session_/),
      expiresAt: expect.any(String),
      model: expect.any(String),
      instructionsPreview: expect.stringContaining("Technical Lead"),
    });
    expect(serializedPayload).not.toContain("sk-standard-secret");
    expect(serializedPayload).not.toContain("OPENAI_API_KEY");
  });

  it("rejects invalid persona ids", async () => {
    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: "session_123",
        personaId: "unknown_persona",
        mode: "customer_qa",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid customer persona",
      },
    });
  });
});
