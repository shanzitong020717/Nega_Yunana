import { describe, expect, it } from "vitest";

import {
  normalizeOpenAIApiKey,
  normalizeOpenAIBaseURL,
} from "@/lib/ai/openai-client";
import { getTextAIBaseURL, getTextAIModel } from "@/lib/ai/text-client";

describe("openai client environment helpers", () => {
  it("normalizes empty and quoted API keys", () => {
    expect(normalizeOpenAIApiKey(undefined)).toBeUndefined();
    expect(normalizeOpenAIApiKey('""')).toBeUndefined();
    expect(normalizeOpenAIApiKey(" 'sk-test' ")).toBe("sk-test");
  });

  it("normalizes third-party OpenAI-compatible base URLs", () => {
    expect(normalizeOpenAIBaseURL(undefined)).toBeUndefined();
    expect(normalizeOpenAIBaseURL('""')).toBeUndefined();
    expect(
      normalizeOpenAIBaseURL(" https://openai-compatible.example.com/v1/// "),
    ).toBe("https://openai-compatible.example.com/v1");
  });

  it("defaults text analysis to DeepSeek v4 pro", () => {
    expect(getTextAIBaseURL()).toBe("https://api.deepseek.com");
    expect(getTextAIModel()).toBe("deepseek-v4-pro");
  });
});
