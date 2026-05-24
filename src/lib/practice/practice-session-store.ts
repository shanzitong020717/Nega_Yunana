import type {
  CreatePracticeSessionInput,
  ResolvedPracticeContext,
  TranscriptTurnInput,
} from "@/lib/validation/practice";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";
import { consolidateReviewMemoryCandidates } from "@/lib/memory/review-memory-consolidation";
import { upsertWeaknessUpdates } from "@/lib/progress/weakness-store";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";
import type { SuggestedAnswerRecord } from "@/lib/validation/suggested-answer";

type PracticeSessionCore = Omit<
  CreatePracticeSessionInput,
  "materialMode" | "materialId" | "prepCardId" | "sourceObjectionId"
> &
  Partial<
    Pick<
      CreatePracticeSessionInput,
      "materialId" | "prepCardId" | "sourceObjectionId"
    >
  >;

export type PracticeSessionRecord = PracticeSessionCore & {
  id: string;
  userId?: string;
  materialMode?: CreatePracticeSessionInput["materialMode"];
  status: "created" | "active" | "completed" | "reviewed";
  resolvedContext?: ResolvedPracticeContext;
  createdAt: string;
  updatedAt?: string;
};

type CreatePracticeSessionRecordInput = PracticeSessionCore & {
  materialMode?: CreatePracticeSessionInput["materialMode"];
  userId?: string;
  resolvedContext?: ResolvedPracticeContext;
};

export type TranscriptTurnRecord = TranscriptTurnInput & {
  id: string;
  sessionId: string;
  createdAt: string;
};

export type ReviewRecord = PracticeReviewPayload & {
  id: string;
  sessionId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

const practiceSessions = new Map<string, PracticeSessionRecord>();
const transcriptTurns = new Map<string, TranscriptTurnRecord[]>();
const reviewRecords = new Map<string, ReviewRecord>();
const suggestedAnswerRecords = new Map<string, SuggestedAnswerRecord[]>();

function getRecordUserId(record: { userId?: string }) {
  return record.userId ?? LOCAL_DEMO_PROFILE_ID;
}

export function listPracticeSessionRecords(scope?: UserScope) {
  const records = Array.from(practiceSessions.values()).filter((session) =>
    scope?.userId ? getRecordUserId(session) === scope.userId : true,
  );

  return records.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getPracticeSessionRecord(sessionId: string, scope?: UserScope) {
  const session = practiceSessions.get(sessionId) ?? null;

  if (!session || (scope?.userId && getRecordUserId(session) !== scope.userId)) {
    return null;
  }

  return session;
}

export function savePracticeSessionRecord(
  input: CreatePracticeSessionRecordInput,
) {
  const now = new Date().toISOString();
  const practiceSession: PracticeSessionRecord = {
    id: `session_${crypto.randomUUID()}`,
    userId: input.userId ?? LOCAL_DEMO_PROFILE_ID,
    status: "created",
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  practiceSessions.set(practiceSession.id, practiceSession);
  return practiceSession;
}

export function ensurePracticeSessionRecord(
  sessionId: string,
  fallback?: Partial<CreatePracticeSessionInput> & UserScope,
) {
  const existingSession = getPracticeSessionRecord(sessionId);

  if (existingSession) {
    return existingSession;
  }

  const now = new Date().toISOString();
  const practiceSession: PracticeSessionRecord = {
    id: sessionId,
    scenarioPackId: fallback?.scenarioPackId ?? "rokid-overseas-sales",
    userId: fallback?.userId ?? LOCAL_DEMO_PROFILE_ID,
    goalId: fallback?.goalId ?? "customer_qa",
    mode: fallback?.mode ?? "customer_qa",
    personaId: fallback?.personaId ?? "technical_lead",
    voicePackId: fallback?.voicePackId ?? "kore-firm",
    materialMode: fallback?.materialMode ?? "no_material",
    materialId: fallback?.materialId,
    prepCardId: fallback?.prepCardId,
    difficulty: fallback?.difficulty ?? "normal",
    trainingFocus: fallback?.trainingFocus ?? ["business value"],
    focusTags: fallback?.focusTags ?? ["商业价值"],
    sourceObjectionId: fallback?.sourceObjectionId,
    status: "created",
    createdAt: now,
    updatedAt: now,
  };

  practiceSessions.set(sessionId, practiceSession);
  return practiceSession;
}

export function saveTranscriptTurns(
  sessionId: string,
  turns: TranscriptTurnInput[],
  scope?: UserScope,
) {
  const now = new Date().toISOString();
  const savedTurns = turns.map((turn) => ({
    id: `turn_${crypto.randomUUID()}`,
    sessionId,
    createdAt: now,
    ...turn,
  }));

  transcriptTurns.set(sessionId, savedTurns);

  const session = ensurePracticeSessionRecord(sessionId, scope);
  practiceSessions.set(sessionId, {
    ...session,
    status: "completed",
    updatedAt: now,
  });

  return savedTurns;
}

export function getTranscriptTurns(sessionId: string, scope?: UserScope) {
  if (scope?.userId && !getPracticeSessionRecord(sessionId, scope)) {
    return [];
  }

  return transcriptTurns.get(sessionId) ?? [];
}

export function saveSuggestedAnswerRecord(
  sessionId: string,
  suggestion: SuggestedAnswerRecord,
  scope?: UserScope,
) {
  if (scope?.userId && !getPracticeSessionRecord(sessionId, scope)) {
    return null;
  }

  const currentSuggestions = suggestedAnswerRecords.get(sessionId) ?? [];
  const nextSuggestions = [...currentSuggestions, suggestion];

  suggestedAnswerRecords.set(sessionId, nextSuggestions);

  return suggestion;
}

export function getSuggestedAnswerRecords(sessionId: string, scope?: UserScope) {
  if (scope?.userId && !getPracticeSessionRecord(sessionId, scope)) {
    return [];
  }

  return suggestedAnswerRecords.get(sessionId) ?? [];
}

export function deleteSuggestedAnswerRecords(sessionId: string) {
  return suggestedAnswerRecords.delete(sessionId);
}

export function deleteTranscriptTurns(sessionId: string) {
  return transcriptTurns.delete(sessionId);
}

export function saveReviewRecord(
  sessionId: string,
  review: PracticeReviewPayload,
  scope?: UserScope,
) {
  const now = new Date().toISOString();
  const existingReview = getReviewBySessionId(sessionId, scope);
  const reviewRecord: ReviewRecord = {
    id: existingReview?.id ?? `review_${crypto.randomUUID()}`,
    sessionId,
    userId: scope?.userId ?? getPracticeSessionRecord(sessionId)?.userId,
    createdAt: existingReview?.createdAt ?? now,
    updatedAt: now,
    ...review,
  };

  reviewRecords.set(reviewRecord.id, reviewRecord);

  const session = ensurePracticeSessionRecord(sessionId, scope);
  practiceSessions.set(sessionId, {
    ...session,
    status: "reviewed",
    updatedAt: now,
  });
  upsertWeaknessUpdates(sessionId, review.weaknessUpdates, {
    userId: getRecordUserId(session),
  });
  consolidateReviewMemoryCandidates(reviewRecord, {
    userId: getRecordUserId(session),
  });

  return reviewRecord;
}

export function getReviewRecord(reviewId: string, scope?: UserScope) {
  const review = reviewRecords.get(reviewId) ?? null;

  if (!review || (scope?.userId && getRecordUserId(review) !== scope.userId)) {
    return null;
  }

  return review;
}

export function listReviewRecords(scope?: UserScope) {
  return Array.from(reviewRecords.values()).filter((review) =>
    scope?.userId ? getRecordUserId(review) === scope.userId : true,
  ).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getReviewBySessionId(sessionId: string, scope?: UserScope) {
  return (
    Array.from(reviewRecords.values()).find(
      (review) =>
        review.sessionId === sessionId &&
        (!scope?.userId || getRecordUserId(review) === scope.userId),
    ) ?? null
  );
}

export function deleteReviewBySessionId(sessionId: string, scope?: UserScope) {
  const review = getReviewBySessionId(sessionId, scope);

  if (!review) {
    return null;
  }

  reviewRecords.delete(review.id);
  return review;
}

export function deletePracticeSessionRecord(sessionId: string, scope?: UserScope) {
  const practiceSession = getPracticeSessionRecord(sessionId, scope);

  if (!practiceSession) {
    return null;
  }

  const review = deleteReviewBySessionId(sessionId, scope);
  const transcriptDeleted = deleteTranscriptTurns(sessionId);
  const suggestedAnswersDeleted = deleteSuggestedAnswerRecords(sessionId);
  practiceSessions.delete(sessionId);

  return {
    practiceSession,
    transcriptDeleted,
    suggestedAnswersDeleted,
    reviewDeleted: Boolean(review),
  };
}

export function deletePracticeSessionsByMaterialId(
  materialId: string,
  scope?: UserScope,
) {
  const deletedSessionIds: string[] = [];

  for (const practiceSession of practiceSessions.values()) {
    if (
      practiceSession.materialId === materialId &&
      (!scope?.userId || getRecordUserId(practiceSession) === scope.userId)
    ) {
      deletePracticeSessionRecord(practiceSession.id, scope);
      deletedSessionIds.push(practiceSession.id);
    }
  }

  return deletedSessionIds;
}
