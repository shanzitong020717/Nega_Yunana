import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/ai-diagnostics/route";
import {
  recordAiCallDiagnostic,
  resetAiCallDiagnosticsForTests,
} from "@/lib/ai/diagnostics";
import { LOCAL_DEMO_PROFILE_ID } from "@/lib/auth/user-scope";

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("GET /api/ai-diagnostics", () => {
  it("returns recent diagnostics and summary scoped to the logged-in user", async () => {
    resetAiCallDiagnosticsForTests();
    recordAiCallDiagnostic({
      attemptCount: 1,
      durationMs: 600,
      feature: "support_cue",
      maxRetries: 1,
      model: "deepseek-v4-flash",
      provider: "DeepSeek",
      schemaName: "support cue",
      status: "success",
      userId: LOCAL_DEMO_PROFILE_ID,
    });
    recordAiCallDiagnostic({
      attemptCount: 2,
      durationMs: 12_000,
      errorType: "upstream_5xx",
      feature: "suggested_answer",
      httpStatus: 503,
      maxRetries: 1,
      model: "deepseek-v4-flash",
      provider: "DeepSeek",
      schemaName: "suggested answer",
      status: "error",
      userId: LOCAL_DEMO_PROFILE_ID,
    });
    recordAiCallDiagnostic({
      attemptCount: 1,
      durationMs: 500,
      feature: "support_cue",
      maxRetries: 1,
      model: "deepseek-v4-flash",
      provider: "DeepSeek",
      schemaName: "support cue",
      status: "success",
      userId: "another_user",
    });

    const response = await GET(
      new Request("http://localhost/api/ai-diagnostics?limit=10"),
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          feature: "suggested_answer",
          status: "error",
          httpStatus: 503,
        }),
        expect.objectContaining({
          feature: "support_cue",
          status: "success",
        }),
      ],
      summary: {
        averageDurationMs: 6300,
        errorCount: 1,
        successCount: 1,
        successRate: 0.5,
        total: 2,
      },
    });
  });
});
