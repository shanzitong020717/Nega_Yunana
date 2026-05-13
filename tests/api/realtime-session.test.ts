import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as createRealtimeSession } from "@/app/api/realtime/session/route";
import { verifyRealtimeRelayToken } from "@/lib/ai/realtime-relay-token";

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

  it("returns signed relay credentials when WebSocket relay transport is enabled", async () => {
    vi.stubEnv("OPENAI_REALTIME_TRANSPORT", "websocket_relay");
    vi.stubEnv("REALTIME_RELAY_URL", "wss://relay.example.com/realtime");
    vi.stubEnv("REALTIME_RELAY_SHARED_SECRET", "relay-secret");
    vi.stubEnv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview");

    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: "session_123",
        personaId: "technical_lead",
        mode: "customer_qa",
        trainingFocus: ["business value"],
      }),
    );

    expect(response.status).toBe(201);
    const payload = await readJson(response);
    const serializedPayload = JSON.stringify(payload);

    expect(payload).toMatchObject({
      transport: "websocket_relay",
      relayUrl: "wss://relay.example.com/realtime",
      relayToken: expect.any(String),
      sessionId: expect.stringMatching(/^rt_session_/),
      expiresAt: expect.any(String),
      model: "gpt-4o-realtime-preview",
      inputAudioSampleRate: 24_000,
      outputAudioSampleRate: 24_000,
      instructionsPreview: expect.stringContaining("Technical Lead"),
    });
    expect(serializedPayload).not.toContain("relay-secret");

    const relayPayload = verifyRealtimeRelayToken(
      String(payload.relayToken),
      {
        secret: "relay-secret",
      },
    );

    expect(relayPayload).toMatchObject({
      practiceSessionId: "session_123",
      realtimeSessionId: payload.sessionId,
      model: "gpt-4o-realtime-preview",
      instructions: expect.stringContaining("Technical Lead"),
    });
  });

  it("returns Gemini Live relay audio settings when configured", async () => {
    vi.stubEnv("OPENAI_REALTIME_TRANSPORT", "websocket_relay");
    vi.stubEnv("REALTIME_RELAY_PROVIDER", "gemini_live");
    vi.stubEnv("REALTIME_RELAY_URL", "wss://relay.example.com/realtime");
    vi.stubEnv("REALTIME_RELAY_SHARED_SECRET", "relay-secret");
    vi.stubEnv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview");

    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: "session_123",
        personaId: "technical_lead",
        mode: "customer_qa",
        trainingFocus: ["business value"],
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      transport: "websocket_relay",
      model: "gemini-3.1-flash-live-preview",
      inputAudioSampleRate: 16_000,
      outputAudioSampleRate: 24_000,
    });
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
        message: "客户角色无效",
      },
    });
  });
});
