import type {
  CreatePracticeSessionInput,
  ResolvedPracticeContext,
  TranscriptTurnInput,
} from "@/lib/validation/practice";
import { upsertWeaknessUpdates } from "@/lib/progress/weakness-store";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";
import type { SuggestedAnswerRecord } from "@/lib/validation/suggested-answer";

export type PracticeSessionRecord = Omit<
  CreatePracticeSessionInput,
  "materialMode"
> & {
  id: string;
  materialMode?: CreatePracticeSessionInput["materialMode"];
  status: "created" | "active" | "completed" | "reviewed";
  resolvedContext?: ResolvedPracticeContext;
  createdAt: string;
  updatedAt?: string;
};

export type TranscriptTurnRecord = TranscriptTurnInput & {
  id: string;
  sessionId: string;
  createdAt: string;
};

export type ReviewRecord = PracticeReviewPayload & {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

const practiceSessions = new Map<string, PracticeSessionRecord>();
const transcriptTurns = new Map<string, TranscriptTurnRecord[]>();
const reviewRecords = new Map<string, ReviewRecord>();
const suggestedAnswerRecords = new Map<string, SuggestedAnswerRecord[]>();

export function listPracticeSessionRecords() {
  return Array.from(practiceSessions.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getPracticeSessionRecord(sessionId: string) {
  return practiceSessions.get(sessionId) ?? null;
}

export function savePracticeSessionRecord(
  input: CreatePracticeSessionInput & {
    resolvedContext?: ResolvedPracticeContext;
  },
) {
  const now = new Date().toISOString();
  const practiceSession: PracticeSessionRecord = {
    id: `session_${crypto.randomUUID()}`,
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
  fallback?: Partial<CreatePracticeSessionInput>,
) {
  const existingSession = getPracticeSessionRecord(sessionId);

  if (existingSession) {
    return existingSession;
  }

  const now = new Date().toISOString();
  const practiceSession: PracticeSessionRecord = {
    id: sessionId,
    scenarioPackId: fallback?.scenarioPackId ?? "rokid-overseas-sales",
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
) {
  const now = new Date().toISOString();
  const savedTurns = turns.map((turn) => ({
    id: `turn_${crypto.randomUUID()}`,
    sessionId,
    createdAt: now,
    ...turn,
  }));

  transcriptTurns.set(sessionId, savedTurns);

  const session = ensurePracticeSessionRecord(sessionId);
  practiceSessions.set(sessionId, {
    ...session,
    status: "completed",
    updatedAt: now,
  });

  return savedTurns;
}

export function getTranscriptTurns(sessionId: string) {
  return transcriptTurns.get(sessionId) ?? [];
}

export function saveSuggestedAnswerRecord(
  sessionId: string,
  suggestion: SuggestedAnswerRecord,
) {
  const currentSuggestions = suggestedAnswerRecords.get(sessionId) ?? [];
  const nextSuggestions = [...currentSuggestions, suggestion];

  suggestedAnswerRecords.set(sessionId, nextSuggestions);

  return suggestion;
}

export function getSuggestedAnswerRecords(sessionId: string) {
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
) {
  const now = new Date().toISOString();
  const existingReview = getReviewBySessionId(sessionId);
  const reviewRecord: ReviewRecord = {
    id: existingReview?.id ?? `review_${crypto.randomUUID()}`,
    sessionId,
    createdAt: existingReview?.createdAt ?? now,
    updatedAt: now,
    ...review,
  };

  reviewRecords.set(reviewRecord.id, reviewRecord);

  const session = ensurePracticeSessionRecord(sessionId);
  practiceSessions.set(sessionId, {
    ...session,
    status: "reviewed",
    updatedAt: now,
  });
  upsertWeaknessUpdates(sessionId, review.weaknessUpdates);

  return reviewRecord;
}

export function getReviewRecord(reviewId: string) {
  return reviewRecords.get(reviewId) ?? null;
}

export function getReviewBySessionId(sessionId: string) {
  return (
    Array.from(reviewRecords.values()).find(
      (review) => review.sessionId === sessionId,
    ) ?? null
  );
}

export function deleteReviewBySessionId(sessionId: string) {
  const review = getReviewBySessionId(sessionId);

  if (!review) {
    return null;
  }

  reviewRecords.delete(review.id);
  return review;
}

export function deletePracticeSessionRecord(sessionId: string) {
  const practiceSession = getPracticeSessionRecord(sessionId);

  if (!practiceSession) {
    return null;
  }

  const review = deleteReviewBySessionId(sessionId);
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

export function deletePracticeSessionsByMaterialId(materialId: string) {
  const deletedSessionIds: string[] = [];

  for (const practiceSession of practiceSessions.values()) {
    if (practiceSession.materialId === materialId) {
      deletePracticeSessionRecord(practiceSession.id);
      deletedSessionIds.push(practiceSession.id);
    }
  }

  return deletedSessionIds;
}
