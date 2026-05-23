import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as createRealtimeSession } from "@/app/api/realtime/session/route";
import { POST as createPracticeSession } from "@/app/api/practice-sessions/route";
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
        scenarioPackId: "rokid-overseas-sales",
        goalId: "customer_qa",
        practiceSessionId: "session_123",
        personaId: "technical_lead",
        voicePackId: "charon-informative",
        materialId: "material_123",
        mode: "customer_qa",
        trainingFocus: ["business value"],
        focusTags: ["商业价值", "产品参数解释"],
        memorySnippets: ["The learner tends to answer before clarifying the use case."],
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
      instructionsPreview: expect.stringContaining("技术负责人"),
    });
    expect(payload.instructionsPreview).toContain("Rokid 海外商务会谈");
    expect(payload.instructionsPreview).toContain("客户问答");
    expect(payload.instructionsPreview).toContain("Charon 清晰信息型");
    expect(payload.instructionsPreview).toContain("商业价值");
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
        personaId: "channel_partner",
        voicePackId: "puck-upbeat",
        mode: "solution_meeting",
        trainingFocus: ["channel partnership"],
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
      instructionsPreview: expect.stringContaining("渠道合作伙伴"),
      voiceName: "verse",
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
      voiceName: "verse",
      instructions: expect.stringContaining("渠道合作伙伴"),
    });
    expect(relayPayload.instructions).toContain("Puck 轻快外向");
    expect(relayPayload.instructions).not.toContain("Charon 清晰信息型");
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
        personaId: "channel_partner",
        voicePackId: "puck-upbeat",
        mode: "solution_meeting",
        trainingFocus: ["channel partnership"],
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      transport: "websocket_relay",
      model: "gemini-3.1-flash-live-preview",
      inputAudioSampleRate: 16_000,
      outputAudioSampleRate: 24_000,
      voiceName: "Puck",
      instructionsPreview: expect.stringContaining("渠道合作伙伴"),
    });
  });

  it("returns the selected Gemini Live female voice for female voice packs", async () => {
    vi.stubEnv("OPENAI_REALTIME_TRANSPORT", "websocket_relay");
    vi.stubEnv("REALTIME_RELAY_PROVIDER", "gemini_live");
    vi.stubEnv("REALTIME_RELAY_URL", "wss://relay.example.com/realtime");
    vi.stubEnv("REALTIME_RELAY_SHARED_SECRET", "relay-secret");
    vi.stubEnv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview");

    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: "session_123",
        personaId: "enterprise_buyer",
        voicePackId: "kore-firm",
        mode: "customer_qa",
        trainingFocus: ["customer scenarios"],
      }),
    );

    expect(response.status).toBe(201);
    const payload = await readJson(response);
    const relayPayload = verifyRealtimeRelayToken(String(payload.relayToken), {
      secret: "relay-secret",
    });

    expect(payload).toMatchObject({
      transport: "websocket_relay",
      voiceName: "Kore",
      instructionsPreview: expect.stringContaining("Voice gender: female"),
    });
    expect(relayPayload).toMatchObject({
      voiceName: "Kore",
      instructions: expect.stringContaining("Kore 坚定专业"),
    });
  });

  it("accepts scenario-pack-only customer personas", async () => {
    vi.stubEnv("AI_MOCK_MODE", "true");

    const response = await createRealtimeSession(
      jsonRequest({
        scenarioPackId: "rokid-overseas-sales",
        goalId: "solution_meeting",
        practiceSessionId: "session_123",
        personaId: "channel_partner",
        voicePackId: "puck-upbeat",
        mode: "solution_meeting",
        trainingFocus: ["channel partnership"],
        focusTags: ["渠道合作"],
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      instructionsPreview: expect.stringContaining("渠道合作伙伴"),
    });
  });

  it("uses enriched practice session context when only the session id is provided", async () => {
    vi.stubEnv("AI_MOCK_MODE", "true");

    const createdSessionResponse = await createPracticeSession(
      jsonRequest({
        scenarioPackId: "rokid-overseas-sales",
        goalId: "solution_meeting",
        mode: "solution_meeting",
        personaId: "executive_decision_maker",
        voicePackId: "fenrir-excitable",
        materialMode: "memory_context",
        difficulty: "normal",
        trainingFocus: ["战略价值", "竞品差异"],
        focusTags: ["战略价值", "竞品差异"],
      }),
    );
    const createdSessionPayload = await readJson(createdSessionResponse);
    const practiceSession = createdSessionPayload.practiceSession as {
      id: string;
    };

    const response = await createRealtimeSession(
      jsonRequest({
        practiceSessionId: practiceSession.id,
      }),
    );

    expect(response.status).toBe(201);
    const payload = await readJson(response);
    expect(payload.instructionsPreview).toEqual(
      expect.stringContaining("高管决策者"),
    );
    expect(payload.instructionsPreview).toEqual(
      expect.stringContaining("Fenrir 高能追问"),
    );
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
