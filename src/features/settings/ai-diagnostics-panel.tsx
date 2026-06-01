import type {
  AiCallDiagnosticRecord,
  AiCallDiagnosticSummary,
} from "@/lib/ai/diagnostics";

type AiDiagnosticsPanelProps = {
  diagnostics: AiCallDiagnosticRecord[];
  summary: AiCallDiagnosticSummary;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(ms >= 1000 ? 1 : 2)}s`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: AiCallDiagnosticRecord["status"]) {
  return status === "success" ? "成功" : "失败";
}

function statusClassName(status: AiCallDiagnosticRecord["status"]) {
  return status === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

function errorLabel(record: AiCallDiagnosticRecord) {
  if (record.status === "success") {
    return "无";
  }

  return [record.errorType, record.httpStatus].filter(Boolean).join(" · ");
}

export function AiDiagnosticsPanel({
  diagnostics,
  summary,
}: AiDiagnosticsPanelProps) {
  const metrics = [
    ["总调用", String(summary.total)],
    ["成功率", formatPercent(summary.successRate)],
    ["平均耗时", formatDuration(summary.averageDurationMs)],
    ["失败次数", String(summary.errorCount)],
  ];

  return (
    <section
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
      aria-labelledby="ai-diagnostics-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary-strong)]">
            服务稳定性
          </p>
          <h2 id="ai-diagnostics-title" className="mt-1 text-lg font-semibold">
            AI 调用诊断
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            记录文本模型调用的模块、模型、耗时、重试和错误类型，不保存提示词、API Key 或完整响应。
          </p>
        </div>
        <a
          href="/api/ai-diagnostics?limit=50"
          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          查看 JSON
        </a>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4"
          >
            <dt className="text-sm text-[var(--muted)]">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 overflow-x-auto">
        <table
          aria-label="最近 AI 调用"
          className="min-w-full border-separate border-spacing-0 text-left text-sm"
        >
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                模块
              </th>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                模型
              </th>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                状态
              </th>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                耗时
              </th>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                重试
              </th>
              <th className="border-b border-[var(--border)] py-3 pr-4 font-semibold">
                错误
              </th>
              <th className="border-b border-[var(--border)] py-3 font-semibold">
                时间
              </th>
            </tr>
          </thead>
          <tbody>
            {diagnostics.length === 0 ? (
              <tr>
                <td className="py-5 text-[var(--muted)]" colSpan={7}>
                  还没有记录到 AI 调用。完成一次提示分析后，这里会显示诊断信息。
                </td>
              </tr>
            ) : (
              diagnostics.map((record) => (
                <tr key={record.id}>
                  <td className="border-b border-[var(--border)] py-3 pr-4 font-medium">
                    {record.feature}
                  </td>
                  <td className="border-b border-[var(--border)] py-3 pr-4 text-[var(--muted)]">
                    {record.model}
                  </td>
                  <td className="border-b border-[var(--border)] py-3 pr-4">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusClassName(record.status)}`}
                    >
                      {statusLabel(record.status)}
                    </span>
                  </td>
                  <td className="border-b border-[var(--border)] py-3 pr-4">
                    {formatDuration(record.durationMs)}
                  </td>
                  <td className="border-b border-[var(--border)] py-3 pr-4">
                    {Math.max(0, record.attemptCount - 1)} / {record.maxRetries}
                  </td>
                  <td className="border-b border-[var(--border)] py-3 pr-4 text-[var(--muted)]">
                    {errorLabel(record)}
                  </td>
                  <td className="border-b border-[var(--border)] py-3 text-[var(--muted)]">
                    {formatTime(record.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
