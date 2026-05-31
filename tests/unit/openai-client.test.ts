import { describe, expect, it, vi } from "vitest";

import {
  listAiCallDiagnostics,
  resetAiCallDiagnosticsForTests,
} from "@/lib/ai/diagnostics";
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

  it("records diagnostics for successful text generation calls", async () => {
    resetAiCallDiagnosticsForTests();
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
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
      }),
    );

    await expect(
      generateTextJSON({
        diagnostics: {
          feature: "support_cue",
          sessionId: "session_1",
          userId: "user_1",
        },
        model: "deepseek-v4-flash",
        prompt: "Return JSON.",
        schemaName: "support cue",
        maxRetries: 0,
      }),
    ).resolves.toEqual({ ok: true });

    expect(listAiCallDiagnostics({ userId: "user_1" })).toEqual([
      expect.objectContaining({
        attemptCount: 1,
        feature: "support_cue",
        maxRetries: 0,
        model: "deepseek-v4-flash",
        provider: "DeepSeek",
        schemaName: "support cue",
        sessionId: "session_1",
        status: "success",
      }),
    ]);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("records final diagnostics for failed text generation calls after retry", async () => {
    resetAiCallDiagnosticsForTests();
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: "upstream overloaded",
          },
        }),
      }),
    );

    await expect(
      generateTextJSON({
        diagnostics: {
          feature: "suggested_answer",
          sessionId: "session_2",
          userId: "user_1",
        },
        model: "deepseek-v4-pro",
        prompt: "Return JSON.",
        schemaName: "suggested answer",
        maxRetries: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow("upstream overloaded");

    expect(listAiCallDiagnostics({ userId: "user_1" })).toEqual([
      expect.objectContaining({
        attemptCount: 2,
        errorMessage: "upstream overloaded",
        errorType: "upstream_5xx",
        feature: "suggested_answer",
        httpStatus: 503,
        maxRetries: 1,
        model: "deepseek-v4-pro",
        status: "error",
      }),
    ]);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("falls back to the default text model when the primary model has a transient failure", async () => {
    resetAiCallDiagnosticsForTests();
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubEnv("DEEPSEEK_TEXT_MODEL", "deepseek-v4-pro");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: "flash overloaded",
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
                content: "{\"ok\":true,\"model\":\"fallback\"}",
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateTextJSON({
        diagnostics: {
          feature: "support_cue",
          sessionId: "session_fallback",
          userId: "user_fallback",
        },
        model: "deepseek-v4-flash",
        prompt: "Return JSON.",
        schemaName: "support cue",
        maxRetries: 0,
      }),
    ).resolves.toEqual({ ok: true, model: "fallback" });

    const requestBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse((call[1] as RequestInit).body as string) as { model: string },
    );
    expect(requestBodies.map((body) => body.model)).toEqual([
      "deepseek-v4-flash",
      "deepseek-v4-pro",
    ]);
    expect(listAiCallDiagnostics({ userId: "user_fallback" })).toEqual([
      expect.objectContaining({
        attemptCount: 2,
        feature: "support_cue",
        metadata: expect.objectContaining({
          attemptedModels: ["deepseek-v4-flash", "deepseek-v4-pro"],
          fallbackUsed: true,
          primaryModel: "deepseek-v4-flash",
        }),
        model: "deepseek-v4-pro",
        status: "success",
      }),
    ]);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not switch fallback models for non-retryable authentication errors", async () => {
    resetAiCallDiagnosticsForTests();
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubEnv("DEEPSEEK_TEXT_MODEL", "deepseek-v4-pro");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: "invalid api key",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateTextJSON({
        diagnostics: {
          feature: "suggested_answer",
          userId: "user_auth_error",
        },
        model: "deepseek-v4-flash",
        prompt: "Return JSON.",
        schemaName: "suggested answer",
        maxRetries: 0,
      }),
    ).rejects.toThrow("invalid api key");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(listAiCallDiagnostics({ userId: "user_auth_error" })).toEqual([
      expect.objectContaining({
        errorType: "http_error",
        httpStatus: 401,
        metadata: expect.objectContaining({
          attemptedModels: ["deepseek-v4-flash"],
          fallbackUsed: false,
          primaryModel: "deepseek-v4-flash",
        }),
        model: "deepseek-v4-flash",
        status: "error",
      }),
    ]);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
