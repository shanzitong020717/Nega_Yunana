import { describe, expect, it, vi } from "vitest";

import {
  normalizeOpenAIApiKey,
  normalizeOpenAIBaseURL,
} from "@/lib/ai/openai-client";
import {
  generateTextJSON,
  getTextAIBaseURL,
  getTextAIModel,
} from "@/lib/ai/text-client";

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

  it("aborts slow text generation requests after the configured timeout", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("request aborted"));
          });
        });
      }),
    );

    const generation = generateTextJSON({
      prompt: "Return JSON.",
      schemaName: "suggested answer",
      timeoutMs: 10,
      maxRetries: 0,
    });
    const expectation = expect(generation).rejects.toThrow(
      "suggested answer generation timed out after 10ms.",
    );

    await vi.advanceTimersByTimeAsync(10);
    await expectation;

    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("retries transient text generation failures before surfacing an error", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: "upstream overloaded",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "{\"ok\":true}",
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateTextJSON({
        prompt: "Return JSON.",
        schemaName: "support cue",
        maxRetries: 1,
        retryDelayMs: 0,
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
