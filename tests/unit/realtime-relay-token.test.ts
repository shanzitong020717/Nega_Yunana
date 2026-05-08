import { describe, expect, it } from "vitest";

import {
  createRealtimeRelayToken,
  verifyRealtimeRelayToken,
} from "@/lib/ai/realtime-relay-token";

const basePayload = {
  practiceSessionId: "session_123",
  realtimeSessionId: "rt_session_123",
  model: "gpt-4o-realtime-preview",
  instructions: "Ask one concise customer discovery question.",
};

describe("realtime relay token", () => {
  it("verifies signed relay session payloads without exposing the shared secret", () => {
    const token = createRealtimeRelayToken(basePayload, {
      secret: "relay-secret",
      now: new Date("2026-05-08T12:00:00.000Z"),
      ttlSeconds: 600,
    });

    const verifiedPayload = verifyRealtimeRelayToken(token, {
      secret: "relay-secret",
      now: new Date("2026-05-08T12:05:00.000Z"),
    });

    expect(verifiedPayload).toMatchObject({
      practiceSessionId: "session_123",
      realtimeSessionId: "rt_session_123",
      model: "gpt-4o-realtime-preview",
      instructions: "Ask one concise customer discovery question.",
      expiresAt: "2026-05-08T12:10:00.000Z",
    });
    expect(token).not.toContain("relay-secret");
  });

  it("rejects expired or tampered relay tokens", () => {
    const token = createRealtimeRelayToken(basePayload, {
      secret: "relay-secret",
      now: new Date("2026-05-08T12:00:00.000Z"),
      ttlSeconds: 60,
    });

    expect(() =>
      verifyRealtimeRelayToken(token, {
        secret: "relay-secret",
        now: new Date("2026-05-08T12:02:00.000Z"),
      }),
    ).toThrow("Realtime relay token has expired.");

    const tamperedToken = token.replace(/.$/, "x");

    expect(() =>
      verifyRealtimeRelayToken(tamperedToken, {
        secret: "relay-secret",
        now: new Date("2026-05-08T12:00:30.000Z"),
      }),
    ).toThrow("Realtime relay token signature is invalid.");
  });
});
