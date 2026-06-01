import { describe, expect, it } from "vitest";

import {
  isRealtimeRelayOriginAllowed,
  parseRealtimeRelayAllowedOrigins,
} from "@/lib/ai/realtime-relay-origin";

describe("realtime relay origin allowlist", () => {
  it("allows explicitly configured production origins", () => {
    const allowedOrigins = parseRealtimeRelayAllowedOrigins(
      "https://nega-yunana.vercel.app",
    );

    expect(
      isRealtimeRelayOriginAllowed(
        "https://nega-yunana.vercel.app",
        allowedOrigins,
      ),
    ).toBe(true);
  });

  it("allows local development and project preview origins for testing", () => {
    const allowedOrigins = parseRealtimeRelayAllowedOrigins(
      "https://nega-yunana.vercel.app",
    );

    expect(
      isRealtimeRelayOriginAllowed("http://127.0.0.1:3001", allowedOrigins),
    ).toBe(true);
    expect(
      isRealtimeRelayOriginAllowed("http://localhost:3000", allowedOrigins),
    ).toBe(true);
    expect(
      isRealtimeRelayOriginAllowed(
        "https://nega-yunana-lulcxjzsm-shanzitong020717-9686s-projects.vercel.app",
        allowedOrigins,
      ),
    ).toBe(true);
  });

  it("rejects unrelated browser origins when an allowlist is configured", () => {
    const allowedOrigins = parseRealtimeRelayAllowedOrigins(
      "https://nega-yunana.vercel.app",
    );

    expect(
      isRealtimeRelayOriginAllowed("https://example.com", allowedOrigins),
    ).toBe(false);
    expect(isRealtimeRelayOriginAllowed(undefined, allowedOrigins)).toBe(false);
  });
});
