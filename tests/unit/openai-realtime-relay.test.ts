import { describe, expect, it } from "vitest";

import { buildOpenAIRealtimeSessionUpdate } from "@/lib/ai/openai-realtime-relay";

describe("OpenAI realtime relay helpers", () => {
  it("builds session updates with the selected provider voice", () => {
    expect(
      buildOpenAIRealtimeSessionUpdate({
        instructions: "Act as a channel partner customer.",
        voiceName: "verse",
      }),
    ).toMatchObject({
      session: {
        instructions: "Act as a channel partner customer.",
        voice: "verse",
      },
      type: "session.update",
    });
  });
});
