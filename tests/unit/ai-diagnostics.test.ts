import { describe, expect, it } from "vitest";

import {
  listAiCallDiagnostics,
  recordAiCallDiagnostic,
  resetAiCallDiagnosticsForTests,
  summarizeAiCallDiagnostics,
} from "@/lib/ai/diagnostics";

describe("AI call diagnostics store", () => {
  it("records sanitized success and error events with summary metrics", () => {
    resetAiCallDiagnosticsForTests();

    recordAiCallDiagnostic({
      feature: "support_cue",
      schemaName: "support cue",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "success",
      durationMs: 840,
      attemptCount: 1,
      maxRetries: 1,
      timeoutMs: 10_000,
      userId: "user_1",
      sessionId: "session_1",
    });
    recordAiCallDiagnostic({
      feature: "suggested_answer",
      schemaName: "suggested answer",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "error",
      durationMs: 12_000,
      attemptCount: 2,
      maxRetries: 1,
      timeoutMs: 12_000,
      httpStatus: 504,
      errorType: "timeout",
      errorMessage: "request timed out",
      userId: "user_1",
      sessionId: "session_1",
      metadata: {
        prompt: "must not be stored",
        authorization: "Bearer sk-secret",
        raw: { choices: [] },
        safeKey: "safe value",
      },
    });

    const records = listAiCallDiagnostics({ userId: "user_1" });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      status: "error",
      feature: "suggested_answer",
      httpStatus: 504,
      attemptCount: 2,
    });
    expect(records[0]?.metadata).toEqual({ safeKey: "safe value" });
    expect(summarizeAiCallDiagnostics(records)).toMatchObject({
      total: 2,
      successCount: 1,
      errorCount: 1,
      successRate: 0.5,
      averageDurationMs: 6420,
    });
  });

  it("filters diagnostics by user, status, and feature", () => {
    resetAiCallDiagnosticsForTests();

    recordAiCallDiagnostic({
      feature: "support_cue",
      schemaName: "support cue",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "success",
      durationMs: 500,
      attemptCount: 1,
      maxRetries: 1,
      userId: "user_1",
    });
    recordAiCallDiagnostic({
      feature: "support_cue",
      schemaName: "support cue",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "error",
      durationMs: 700,
      attemptCount: 2,
      maxRetries: 1,
      userId: "user_2",
    });

    expect(
      listAiCallDiagnostics({
        feature: "support_cue",
        status: "success",
        userId: "user_1",
      }),
    ).toHaveLength(1);
    expect(
      listAiCallDiagnostics({
        feature: "support_cue",
        status: "success",
        userId: "user_2",
      }),
    ).toHaveLength(0);
  });
});
