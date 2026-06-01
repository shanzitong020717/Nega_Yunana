import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiDiagnosticsPanel } from "@/features/settings/ai-diagnostics-panel";
import type {
  AiCallDiagnosticRecord,
  AiCallDiagnosticSummary,
} from "@/lib/ai/diagnostics";

describe("AiDiagnosticsPanel", () => {
  it("renders reliability summary and recent sanitized calls", () => {
    const summary: AiCallDiagnosticSummary = {
      averageDurationMs: 6300,
      errorCount: 1,
      successCount: 1,
      successRate: 0.5,
      total: 2,
    };
    const diagnostics: AiCallDiagnosticRecord[] = [
      {
        id: "diag_error",
        attemptCount: 2,
        createdAt: "2026-06-01T00:00:00.000Z",
        durationMs: 12_000,
        errorType: "upstream_5xx",
        feature: "suggested_answer",
        httpStatus: 503,
        maxRetries: 1,
        metadata: {},
        model: "deepseek-v4-flash",
        provider: "DeepSeek",
        schemaName: "suggested answer",
        status: "error",
        timeoutMs: 12_000,
        userId: "user_1",
      },
      {
        id: "diag_success",
        attemptCount: 1,
        createdAt: "2026-06-01T00:01:00.000Z",
        durationMs: 600,
        feature: "support_cue",
        maxRetries: 1,
        metadata: {},
        model: "deepseek-v4-flash",
        provider: "DeepSeek",
        schemaName: "support cue",
        status: "success",
        timeoutMs: 10_000,
        userId: "user_1",
      },
    ];

    render(
      <AiDiagnosticsPanel diagnostics={diagnostics} summary={summary} />,
    );

    expect(screen.getByRole("heading", { name: "AI 调用诊断" })).toBeInTheDocument();
    expect(screen.getByText("成功率")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("平均耗时")).toBeInTheDocument();
    expect(screen.getByText("6.3s")).toBeInTheDocument();

    const recentCalls = screen.getByRole("table", { name: "最近 AI 调用" });
    expect(within(recentCalls).getByText("suggested_answer")).toBeInTheDocument();
    expect(within(recentCalls).getByText("upstream_5xx · 503")).toBeInTheDocument();
    expect(screen.queryByText(/sk-/)).not.toBeInTheDocument();
  });
});
