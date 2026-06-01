import { describe, expect, it } from "vitest";

import { buildRelayReadyEvent } from "@/lib/ai/realtime-relay-ready";

describe("realtime relay ready event", () => {
  it("includes the selected provider voice for browser diagnostics", () => {
    expect(
      buildRelayReadyEvent({
        model: "gemini-3.1-flash-live-preview",
        provider: "gemini_live",
        realtimeSessionId: "rt_session_123",
        voiceName: "Leda",
      }),
    ).toEqual({
      type: "relay.ready",
      model: "gemini-3.1-flash-live-preview",
      provider: "gemini_live",
      realtimeSessionId: "rt_session_123",
      voiceName: "Leda",
    });
  });
});
