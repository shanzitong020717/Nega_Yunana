import {
  type CreateMemoryInput,
  type MemoryItem,
  type MemoryType,
  type UpdateMemoryInput,
} from "@/lib/validation/memory";
import type { MemoryCandidate } from "@/lib/validation/reviews";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";

type ListMemoriesInput = {
  type?: MemoryType | "all";
  enabledForAi?: boolean;
} & UserScope;

type RankMemoriesInput = {
  focusTags?: string[];
  limit?: number;
} & UserScope;

type StoredMemoryItem = MemoryItem & {
  userId?: string;
};

const now = new Date().toISOString();

const memoryItems = new Map<string, StoredMemoryItem>([
  [
    "memory_default_speaking_habit",
    {
      id: "memory_default_speaking_habit",
      userId: LOCAL_DEMO_PROFILE_ID,
      scenarioPackId: "rokid-overseas-sales",
      type: "speaking_habit",
      title: "Feature-first answering pattern",
      summary:
        "The learner often starts with product functions before connecting them to customer workflow value.",
      source: "system",
      sourceCreatedAt: now,
      confidence: 0.78,
      importance: 4,
      lastUsedAt: null,
      useCount: 2,
      enabledForAi: true,
      sensitive: false,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
  [
    "memory_default_learning_preference",
    {
      id: "memory_default_learning_preference",
      userId: LOCAL_DEMO_PROFILE_ID,
      scenarioPackId: "rokid-overseas-sales",
      type: "learning_preference",
      title: "Prefers business-ready English",
      summary:
        "The learner benefits from concise English expressions with Chinese review notes and direct customer-meeting use cases.",
      source: "system",
      sourceCreatedAt: now,
      confidence: 0.72,
      importance: 3,
      lastUsedAt: null,
      useCount: 1,
      enabledForAi: true,
      sensitive: false,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
]);

const candidateTypeMap: Record<string, MemoryType> = {
  customer_context: "customer_context",
  learning_preference: "learning_preference",
  material_context: "material_context",
  practice_focus: "learning_preference",
  recurring_error: "weakness",
  speaking_pattern: "speaking_habit",
  strength: "learning_preference",
};

export type ReviewMemoryUpsertResult = StoredMemoryItem & {
  action: "created" | "merged";
};

function getRecordUserId(record: { userId?: string }) {
  return record.userId ?? LOCAL_DEMO_PROFILE_ID;
}

function sortByUpdatedAt(memories: StoredMemoryItem[]) {
  return [...memories].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function listMemories(input: ListMemoriesInput = {}) {
  const memories = Array.from(memoryItems.values()).filter((memory) => {
    const matchesUser = input.userId
      ? getRecordUserId(memory) === input.userId
      : true;
    const matchesType =
      !input.type || input.type === "all" || memory.type === input.type;
    const matchesEnabled =
      input.enabledForAi === undefined ||
      memory.enabledForAi === input.enabledForAi;

    return matchesUser && matchesType && matchesEnabled;
  });

  return sortByUpdatedAt(memories);
}

export function getMemory(memoryId: string, scope?: UserScope) {
  const memory = memoryItems.get(memoryId) ?? null;

  if (!memory || (scope?.userId && getRecordUserId(memory) !== scope.userId)) {
    return null;
  }

  return memory;
}

export function createMemory(input: CreateMemoryInput & UserScope) {
  const createdAt = new Date().toISOString();
  const memory: StoredMemoryItem = {
    id: `memory_${crypto.randomUUID()}`,
    userId: input.userId ?? LOCAL_DEMO_PROFILE_ID,
    scenarioPackId: input.scenarioPackId,
    type: input.type,
    title: input.title,
    summary: input.summary,
    source: input.source,
    sourceCreatedAt: input.sourceCreatedAt ?? createdAt,
    confidence: input.confidence,
    importance: input.importance,
    lastUsedAt: null,
    useCount: 0,
    enabledForAi: input.enabledForAi,
    sensitive: input.sensitive,
    expiresAt: input.expiresAt ?? null,
    createdAt,
    updatedAt: createdAt,
  };

  memoryItems.set(memory.id, memory);

  return memory;
}

function normalizeMemoryText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findSimilarMemory(type: MemoryType, title: string, scope?: UserScope) {
  const normalizedTitle = normalizeMemoryText(title);

  return listMemories(scope).find((memory) => {
    if (memory.type !== type) {
      return false;
    }

    const memoryTitle = normalizeMemoryText(memory.title);

    return (
      memoryTitle === normalizedTitle ||
      memoryTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(memoryTitle)
    );
  });
}

function buildMergedSummary(memory: MemoryItem, candidate: MemoryCandidate) {
  const evidenceText = candidate.evidence.length
    ? ` Evidence: ${candidate.evidence.slice(0, 2).join(" | ")}`
    : "";
  const nextSummary = `${memory.summary}\n\n${candidate.summary}${evidenceText}`;

  return nextSummary.length > 900 ? nextSummary.slice(0, 897).trimEnd() + "..." : nextSummary;
}

export function upsertMemoryFromReviewCandidate(
  candidate: MemoryCandidate,
  source: {
    reviewId: string;
    sessionId: string;
    sourceCreatedAt: string;
    userId?: string;
  },
): ReviewMemoryUpsertResult {
  const type = candidateTypeMap[candidate.type] ?? "learning_preference";
  const scope = { userId: source.userId };
  const existing = findSimilarMemory(type, candidate.title, scope);

  if (!existing) {
    return {
      ...createMemory({
        scenarioPackId: "rokid-overseas-sales",
        type,
        title: candidate.title,
        summary: candidate.summary,
        source: "review",
        sourceCreatedAt: source.sourceCreatedAt,
        confidence: candidate.confidence,
        importance: candidate.importance,
        enabledForAi: candidate.enabledForAi,
        sensitive: candidate.sensitivity !== "low",
        userId: source.userId,
      }),
      action: "created",
    };
  }

  const merged = updateMemory(existing.id, {
    summary: buildMergedSummary(existing, candidate),
    source: "review",
    confidence: Number(
      ((existing.confidence * existing.useCount + candidate.confidence) /
        Math.max(existing.useCount + 1, 1)).toFixed(2),
    ),
    importance: Math.max(existing.importance, candidate.importance),
    enabledForAi: existing.enabledForAi || candidate.enabledForAi,
    sensitive: existing.sensitive || candidate.sensitivity !== "low",
  });

  return {
    ...(merged ?? existing),
    action: "merged",
  };
}

export function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
  scope?: UserScope,
) {
  const memory = getMemory(memoryId, scope);

  if (!memory) {
    return null;
  }

  const updated: MemoryItem = {
    ...memory,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  memoryItems.set(memoryId, updated);

  return updated;
}

export function deleteMemory(memoryId: string, scope?: UserScope) {
  const memory = getMemory(memoryId, scope);

  if (!memory) {
    return null;
  }

  memoryItems.delete(memoryId);

  return memory;
}

function textMatchesFocus(memory: MemoryItem, focusTags: string[]) {
  const haystack = `${memory.title} ${memory.summary} ${memory.type}`.toLowerCase();

  if (focusTags.length === 0) {
    return 0.5;
  }

  const matchedCount = focusTags.filter((tag) =>
    haystack.includes(tag.toLowerCase()),
  ).length;

  return matchedCount / focusTags.length;
}

function recencyScore(memory: MemoryItem) {
  const lastSeenAt = memory.lastUsedAt ?? memory.updatedAt;
  const ageMs = Date.now() - new Date(lastSeenAt).getTime();
  const ageDays = Math.max(ageMs / 86_400_000, 0);

  return Math.max(0, 1 - ageDays / 30);
}

function frequencyScore(memory: MemoryItem) {
  return Math.min(memory.useCount / 10, 1);
}

export function rankMemoriesForPractice(input: RankMemoriesInput = {}) {
  const focusTags = input.focusTags ?? [];
  const limit = input.limit ?? 5;

  return listMemories({ enabledForAi: true, userId: input.userId })
    .map((memory) => {
      const score =
        textMatchesFocus(memory, focusTags) * 0.45 +
        recencyScore(memory) * 0.15 +
        frequencyScore(memory) * 0.15 +
        (memory.importance / 5) * 0.15 +
        memory.confidence * 0.1;

      return {
        memory,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ memory }) => memory);
}
