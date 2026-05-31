export type AiCallDiagnosticStatus = "success" | "error";

export type AiCallDiagnosticInput = {
  attemptCount: number;
  durationMs: number;
  errorMessage?: string;
  errorType?: string;
  feature: string;
  httpStatus?: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
  model: string;
  provider: string;
  schemaName: string;
  sessionId?: string;
  status: AiCallDiagnosticStatus;
  timeoutMs?: number;
  userId?: string;
};

export type AiCallDiagnosticRecord = AiCallDiagnosticInput & {
  createdAt: string;
  id: string;
};

export type AiCallDiagnosticFilter = {
  feature?: string;
  limit?: number;
  status?: AiCallDiagnosticStatus;
  userId?: string;
};

export type AiCallDiagnosticSummary = {
  averageDurationMs: number;
  errorCount: number;
  successCount: number;
  successRate: number;
  total: number;
};

const MAX_MEMORY_RECORDS = 200;
const DEFAULT_LIST_LIMIT = 50;
const SENSITIVE_METADATA_KEYS = new Set([
  "apikey",
  "api_key",
  "authorization",
  "body",
  "content",
  "messages",
  "prompt",
  "raw",
  "request",
  "response",
  "token",
]);

const memoryDiagnostics: AiCallDiagnosticRecord[] = [];

function canPersistAiDiagnostics() {
  return (
    process.env.NEXT_RUNTIME !== "edge" &&
    process.env.NODE_ENV !== "test" &&
    Boolean(process.env.DATABASE_URL)
  );
}

function clampLimit(limit?: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.max(1, Math.min(200, Math.floor(limit ?? DEFAULT_LIST_LIMIT)));
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(sanitizeMetadataValue)
      .filter((item) => item !== undefined);
  }

  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    return undefined;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_METADATA_KEYS.has(key.toLowerCase()))
      .map(([key, nestedValue]) => [key, sanitizeMetadataValue(nestedValue)])
      .filter(([, nestedValue]) => nestedValue !== undefined),
  );
}

export function sanitizeAiDiagnosticMetadata(
  metadata?: Record<string, unknown>,
) {
  return sanitizeMetadataValue(metadata ?? {}) as Record<string, unknown>;
}

function toDbStatus(status: AiCallDiagnosticStatus) {
  return status === "success" ? "SUCCESS" : "ERROR";
}

function fromDbStatus(status: string): AiCallDiagnosticStatus {
  return status === "SUCCESS" ? "success" : "error";
}

function persistAiDiagnostic(record: AiCallDiagnosticRecord) {
  if (!canPersistAiDiagnostics()) {
    return;
  }

  void import("@/lib/db")
    .then(({ getDb }) => getDb())
    .then((db) =>
      db.aiCallDiagnostic.create({
        data: {
          id: record.id,
          attemptCount: record.attemptCount,
          durationMs: record.durationMs,
          errorMessage: record.errorMessage,
          errorType: record.errorType,
          feature: record.feature,
          httpStatus: record.httpStatus,
          maxRetries: record.maxRetries,
          metadata: (record.metadata ?? {}) as never,
          model: record.model,
          provider: record.provider,
          schemaName: record.schemaName,
          sessionId: record.sessionId,
          status: toDbStatus(record.status),
          timeoutMs: record.timeoutMs,
          userId: record.userId,
        },
      }),
    )
    .catch((error: unknown) => {
      console.warn("Failed to persist AI call diagnostic.", error);
    });
}

export function recordAiCallDiagnostic(input: AiCallDiagnosticInput) {
  const record: AiCallDiagnosticRecord = {
    ...input,
    id: `diag_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    metadata: sanitizeAiDiagnosticMetadata(input.metadata),
  };

  memoryDiagnostics.unshift(record);
  memoryDiagnostics.splice(MAX_MEMORY_RECORDS);
  persistAiDiagnostic(record);

  return record;
}

function filterRecords(
  records: AiCallDiagnosticRecord[],
  filter: AiCallDiagnosticFilter = {},
) {
  const limit = clampLimit(filter.limit);

  return records
    .filter((record) => (filter.userId ? record.userId === filter.userId : true))
    .filter((record) =>
      filter.status ? record.status === filter.status : true,
    )
    .filter((record) =>
      filter.feature ? record.feature === filter.feature : true,
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}

export function listAiCallDiagnostics(filter: AiCallDiagnosticFilter = {}) {
  return filterRecords(memoryDiagnostics, filter);
}

export async function listAiCallDiagnosticsAsync(
  filter: AiCallDiagnosticFilter = {},
) {
  if (!canPersistAiDiagnostics()) {
    return listAiCallDiagnostics(filter);
  }

  try {
    const { getDb } = await import("@/lib/db");
    const rows = await getDb().aiCallDiagnostic.findMany({
      orderBy: { createdAt: "desc" },
      take: clampLimit(filter.limit),
      where: {
        feature: filter.feature,
        status: filter.status ? toDbStatus(filter.status) : undefined,
        userId: filter.userId,
      },
    });

    return rows.map(
      (row): AiCallDiagnosticRecord => ({
        id: row.id,
        attemptCount: row.attemptCount,
        createdAt: row.createdAt.toISOString(),
        durationMs: row.durationMs,
        errorMessage: row.errorMessage ?? undefined,
        errorType: row.errorType ?? undefined,
        feature: row.feature,
        httpStatus: row.httpStatus ?? undefined,
        maxRetries: row.maxRetries,
        metadata: sanitizeAiDiagnosticMetadata(
          row.metadata as Record<string, unknown>,
        ),
        model: row.model,
        provider: row.provider,
        schemaName: row.schemaName,
        sessionId: row.sessionId ?? undefined,
        status: fromDbStatus(row.status),
        timeoutMs: row.timeoutMs ?? undefined,
        userId: row.userId ?? undefined,
      }),
    );
  } catch (error) {
    console.warn("Failed to list persisted AI call diagnostics.", error);
    return listAiCallDiagnostics(filter);
  }
}

export function summarizeAiCallDiagnostics(
  records: AiCallDiagnosticRecord[],
): AiCallDiagnosticSummary {
  const total = records.length;
  const successCount = records.filter(
    (record) => record.status === "success",
  ).length;
  const errorCount = total - successCount;
  const totalDuration = records.reduce(
    (sum, record) => sum + record.durationMs,
    0,
  );

  return {
    total,
    successCount,
    errorCount,
    successRate: total > 0 ? successCount / total : 0,
    averageDurationMs: total > 0 ? Math.round(totalDuration / total) : 0,
  };
}

export function resetAiCallDiagnosticsForTests() {
  memoryDiagnostics.splice(0);
}
