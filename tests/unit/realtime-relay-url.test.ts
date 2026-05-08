import { describe, expect, it } from "vitest";

import { buildProviderRealtimeWebSocketURL } from "@/lib/ai/realtime-relay-url";

describe("realtime relay provider URL", () => {
  it("builds an OpenAI-compatible Realtime WebSocket URL from an HTTPS base URL", () => {
    expect(
      buildProviderRealtimeWebSocketURL({
        baseURL: "https://api.bltcy.ai/v1/",
        model: "gpt-4o-realtime-preview",
      }),
    ).toBe("wss://api.bltcy.ai/v1/realtime?model=gpt-4o-realtime-preview");
  });

  it("allows explicit provider WebSocket URLs to override the base URL", () => {
    expect(
      buildProviderRealtimeWebSocketURL({
        baseURL: "https://api.bltcy.ai/v1",
        providerWebSocketURL:
          "wss://gateway.example.com/openai/realtime?model=custom",
        model: "gpt-4o-realtime-preview",
      }),
    ).toBe("wss://gateway.example.com/openai/realtime?model=custom");
  });
});
