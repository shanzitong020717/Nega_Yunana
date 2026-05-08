import { describe, expect, it } from "vitest";

import {
  normalizeOpenAIApiKey,
  normalizeOpenAIBaseURL,
} from "@/lib/ai/openai-client";

describe("openai client environment helpers", () => {
  it("normalizes empty and quoted API keys", () => {
    expect(normalizeOpenAIApiKey(undefined)).toBeUndefined();
    expect(normalizeOpenAIApiKey('""')).toBeUndefined();
    expect(normalizeOpenAIApiKey(" 'sk-test' ")).toBe("sk-test");
  });

  it("normalizes third-party OpenAI-compatible base URLs", () => {
    expect(normalizeOpenAIBaseURL(undefined)).toBeUndefined();
    expect(normalizeOpenAIBaseURL('""')).toBeUndefined();
    expect(normalizeOpenAIBaseURL(" https://api.bltcy.ai/v1/// ")).toBe(
      "https://api.bltcy.ai/v1",
    );
  });
});
