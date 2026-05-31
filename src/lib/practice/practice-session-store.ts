import type {
  CreatePracticeSessionInput,
  ResolvedPracticeContext,
  TranscriptTurnInput,
} from "@/lib/validation/practice";
import {
  Difficulty,
  PracticeMode,
  PracticeSessionStatus,
  TranscriptSpeaker,
} from "@/generated/prisma/enums";
import { shouldBypassAuthForE2E } from "@/lib/auth/e2e-bypass";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";
import { getDb } from "@/lib/db";
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

function canPersistPracticeData() {
  return (
    !shouldBypassAuthForE2E() &&
    process.env.NODE_ENV !== "test" &&
    Boolean(process.env.DATABASE_URL)
  );
}

function getRecordUserId(record: { userId?: string }) {
  return record.userId ?? LOCAL_DEMO_PROFILE_ID;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function objectValue<T extends object>(value: unknown): Partial<T> {
  return value && typeof value === "object" ? (value as Partial<T>) : {};
}

function toDateString(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function toDbPracticeMode(mode: PracticeSessionRecord["mode"]) {
  if (mode === "solution_meeting") {
    return PracticeMode.SOLUTION_MEETING;
  }

  if (mode === "objection_handling") {
    return PracticeMode.OBJECTION_CHALLENGE;
  }

  return PracticeMode.CUSTOMER_QA;
}

function fromDbPracticeMode(mode: string): PracticeSessionRecord["mode"] {
  if (mode === PracticeMode.SOLUTION_MEETING) {
    return "solution_meeting";
  }

  if (mode === PracticeMode.OBJECTION_CHALLENGE) {
    return "objection_handling";
  }

  return "customer_qa";
}

function toDbDifficulty(difficulty: PracticeSessionRecord["difficulty"]) {
  if (difficulty === "easy") {
    return Difficulty.EASY;
  }

  if (difficulty === "hard") {
    return Difficulty.HARD;
  }

  if (difficulty === "executive") {
    return Difficulty.EXECUTIVE;
  }

  return Difficulty.NORMAL;
}

function fromDbDifficulty(difficulty: string): PracticeSessionRecord["difficulty"] {
  if (difficulty === Difficulty.EASY) {
    return "easy";
  }

  if (difficulty === Difficulty.HARD) {
    return "hard";
  }

  if (difficulty === Difficulty.EXECUTIVE) {
    return "executive";
  }

  return "normal";
}

function toDbSessionStatus(status: PracticeSessionRecord["status"]) {
  return PracticeSessionStatus[
    status.toUpperCase() as keyof typeof PracticeSessionStatus
  ];
}

function fromDbSessionStatus(status: string): PracticeSessionRecord["status"] {
  if (status === PracticeSessionStatus.ACTIVE) {
    return "active";
  }

  if (status === PracticeSessionStatus.COMPLETED) {
    return "completed";
  }

  if (status === PracticeSessionStatus.REVIEWED) {
    return "reviewed";
  }

  return "created";
}

function toDbSpeaker(speaker: TranscriptTurnInput["speaker"]) {
  if (speaker === "ai_customer") {
    return TranscriptSpeaker.AI_CUSTOMER;
  }

  if (speaker === "system") {
    return TranscriptSpeaker.SYSTEM;
  }

  return TranscriptSpeaker.USER;
}

function fromDbSpeaker(speaker: string): TranscriptTurnInput["speaker"] {
  if (speaker === TranscriptSpeaker.AI_CUSTOMER) {
    return "ai_customer";
  }

  if (speaker === TranscriptSpeaker.SYSTEM) {
    return "system";
  }

  return "user";
}

function persistedSessionToRecord(session: {
  createdAt: unknown;
  difficulty: string;
  focusTags?: unknown;
  goalId?: string;
  id: string;
  materialId?: string | null;
  materialMode?: string | null;
  mode: string;
  payload?: unknown;
  personaId: string;
  prepCardId?: string | null;
  resolvedContext?: unknown;
  scenarioPackId?: string;
  sourceObjectionId?: string | null;
  status: string;
  trainingFocus: unknown;
  updatedAt?: unknown;
  userId: string;
  voicePackId?: string;
}): PracticeSessionRecord {
  const payload = objectValue<PracticeSessionRecord>(session.payload);

  return {
    id: session.id,
    userId: session.userId,
    scenarioPackId:
      payload.scenarioPackId ?? session.scenarioPackId ?? "rokid-overseas-sales",
    goalId: payload.goalId ?? session.goalId ?? "customer_qa",
    mode: payload.mode ?? fromDbPracticeMode(session.mode),
    personaId: payload.personaId ?? session.personaId,
    voicePackId: payload.voicePackId ?? session.voicePackId ?? "kore-firm",
    materialMode:
      payload.materialMode ??
      (session.materialMode as PracticeSessionRecord["materialMode"]) ??
      undefined,
    materialId: payload.materialId ?? session.materialId ?? undefined,
    prepCardId: payload.prepCardId ?? session.prepCardId ?? undefined,
    difficulty: payload.difficulty ?? fromDbDifficulty(session.difficulty),
    trainingFocus:
      payload.trainingFocus ?? stringArray(session.trainingFocus),
    focusTags: payload.focusTags ?? stringArray(session.focusTags),
    sourceObjectionId:
      payload.sourceObjectionId ?? session.sourceObjectionId ?? undefined,
    status: fromDbSessionStatus(session.status),
    resolvedContext:
      payload.resolvedContext ??
      (session.resolvedContext as ResolvedPracticeContext | undefined),
    createdAt: payload.createdAt ?? toDateString(session.createdAt),
    updatedAt: payload.updatedAt ?? toDateString(session.updatedAt),
  };
}

function persistedTurnToRecord(turn: {
  createdAt: unknown;
  id: string;
  metadata: unknown;
  sessionId: string;
  speaker: string;
  text: string;
  timestamp: number;
}): TranscriptTurnRecord {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    speaker: fromDbSpeaker(turn.speaker),
    text: turn.text,
    timestamp: turn.timestamp,
    metadata: objectValue<Record<string, unknown>>(turn.metadata),
    createdAt: toDateString(turn.createdAt),
  };
}

function persistedReviewToRecord(review: {
  createdAt: unknown;
  id: string;
  payload?: unknown;
  session?: { userId?: string } | null;
  sessionId: string;
  updatedAt: unknown;
}): ReviewRecord {
  const payload = objectValue<PracticeReviewPayload>(review.payload);

  return {
    id: review.id,
    sessionId: review.sessionId,
    userId: review.session?.userId,
    createdAt: toDateString(review.createdAt),
    updatedAt: toDateString(review.updatedAt),
    ...(payload as PracticeReviewPayload),
  };
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

export async function persistPracticeSessionRecord(
  practiceSession: PracticeSessionRecord,
) {
  if (!canPersistPracticeData()) {
    return practiceSession;
  }

  const db = getDb();

  await db.practiceSession.upsert({
    where: { id: practiceSession.id },
    create: {
      id: practiceSession.id,
      userId: getRecordUserId(practiceSession),
      scenarioPackId: practiceSession.scenarioPackId,
      goalId: practiceSession.goalId,
      mode: toDbPracticeMode(practiceSession.mode),
      personaId: practiceSession.personaId,
      voicePackId: practiceSession.voicePackId,
      materialMode: practiceSession.materialMode,
      difficulty: toDbDifficulty(practiceSession.difficulty),
      trainingFocus: practiceSession.trainingFocus,
      focusTags: practiceSession.focusTags,
      resolvedContext: practiceSession.resolvedContext,
      payload: practiceSession,
      sourceObjectionId: practiceSession.sourceObjectionId,
      status: toDbSessionStatus(practiceSession.status),
    },
    update: {
      scenarioPackId: practiceSession.scenarioPackId,
      goalId: practiceSession.goalId,
      mode: toDbPracticeMode(practiceSession.mode),
      personaId: practiceSession.personaId,
      voicePackId: practiceSession.voicePackId,
      materialMode: practiceSession.materialMode,
      difficulty: toDbDifficulty(practiceSession.difficulty),
      trainingFocus: practiceSession.trainingFocus,
      focusTags: practiceSession.focusTags,
      resolvedContext: practiceSession.resolvedContext,
      payload: practiceSession,
      sourceObjectionId: practiceSession.sourceObjectionId,
      status: toDbSessionStatus(practiceSession.status),
    },
  });

  return practiceSession;
}

export async function listPracticeSessionRecordsAsync(scope?: UserScope) {
  if (!canPersistPracticeData()) {
    return listPracticeSessionRecords(scope);
  }

  const sessions = await getDb().practiceSession.findMany({
    where: scope?.userId ? { userId: scope.userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return sessions.map(persistedSessionToRecord);
}

export async function getPracticeSessionRecordAsync(
  sessionId: string,
  scope?: UserScope,
) {
  const memorySession = getPracticeSessionRecord(sessionId, scope);

  if (memorySession || !canPersistPracticeData()) {
    return memorySession;
  }

  const session = await getDb().practiceSession.findFirst({
    where: {
      id: sessionId,
      ...(scope?.userId ? { userId: scope.userId } : {}),
    },
  });

  return session ? persistedSessionToRecord(session) : null;
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

export async function ensurePracticeSessionRecordAsync(
  sessionId: string,
  fallback?: Partial<CreatePracticeSessionInput> & UserScope,
) {
  const existingSession = await getPracticeSessionRecordAsync(sessionId, fallback);

  if (existingSession) {
    practiceSessions.set(sessionId, existingSession);
    return existingSession;
  }

  const practiceSession = ensurePracticeSessionRecord(sessionId, fallback);

  await persistPracticeSessionRecord(practiceSession);

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

export async function saveTranscriptTurnsAsync(
  sessionId: string,
  turns: TranscriptTurnInput[],
  scope?: UserScope,
) {
  const savedTurns = saveTranscriptTurns(sessionId, turns, scope);

  if (!canPersistPracticeData()) {
    return savedTurns;
  }

  const session = getPracticeSessionRecord(sessionId, scope) ??
    ensurePracticeSessionRecord(sessionId, scope);

  await persistPracticeSessionRecord(session);
  await getDb().$transaction([
    getDb().transcriptTurn.deleteMany({ where: { sessionId } }),
    ...(savedTurns.length > 0
      ? [
          getDb().transcriptTurn.createMany({
            data: savedTurns.map((turn) => ({
              id: turn.id,
              sessionId,
              speaker: toDbSpeaker(turn.speaker),
              text: turn.text,
              timestamp: turn.timestamp,
              metadata: turn.metadata as never,
              createdAt: new Date(turn.createdAt),
            })),
          }),
        ]
      : []),
    getDb().practiceSession.update({
      where: { id: sessionId },
      data: {
        status: PracticeSessionStatus.COMPLETED,
        endedAt: new Date(),
        payload: getPracticeSessionRecord(sessionId, scope) ?? session,
      },
    }),
  ]);

  return savedTurns;
}

export function getTranscriptTurns(sessionId: string, scope?: UserScope) {
  if (scope?.userId && !getPracticeSessionRecord(sessionId, scope)) {
    return [];
  }

  return transcriptTurns.get(sessionId) ?? [];
}

export async function getTranscriptTurnsAsync(
  sessionId: string,
  scope?: UserScope,
) {
  if (!canPersistPracticeData()) {
    return getTranscriptTurns(sessionId, scope);
  }

  const session = await getPracticeSessionRecordAsync(sessionId, scope);

  if (!session) {
    return [];
  }

  const turns = await getDb().transcriptTurn.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });

  return turns.map(persistedTurnToRecord);
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

export async function saveReviewRecordAsync(
  sessionId: string,
  review: PracticeReviewPayload,
  scope?: UserScope,
) {
  const reviewRecord = saveReviewRecord(sessionId, review, scope);

  if (!canPersistPracticeData()) {
    return reviewRecord;
  }

  const session = getPracticeSessionRecord(sessionId, scope) ??
    ensurePracticeSessionRecord(sessionId, scope);

  await persistPracticeSessionRecord(session);
  await getDb().review.upsert({
    where: { sessionId },
    create: {
      id: reviewRecord.id,
      sessionId,
      payload: review,
      meetingOutcome: review.meetingOutcome,
      scores: review.scores,
      topImprovements: review.topImprovements,
      bestMoments: review.bestMoments,
      sentenceUpgrades: review.sentenceUpgrades,
      materialCoverage: review.materialCoverage,
      phrasebookSuggestions: review.phrasebookSuggestions,
      weaknessUpdates: review.weaknessUpdates,
      nextSessionRecommendation: review.nextSessionRecommendation,
    },
    update: {
      payload: review,
      meetingOutcome: review.meetingOutcome,
      scores: review.scores,
      topImprovements: review.topImprovements,
      bestMoments: review.bestMoments,
      sentenceUpgrades: review.sentenceUpgrades,
      materialCoverage: review.materialCoverage,
      phrasebookSuggestions: review.phrasebookSuggestions,
      weaknessUpdates: review.weaknessUpdates,
      nextSessionRecommendation: review.nextSessionRecommendation,
    },
  });
  await getDb().practiceSession.update({
    where: { id: sessionId },
    data: {
      status: PracticeSessionStatus.REVIEWED,
      payload: getPracticeSessionRecord(sessionId, scope) ?? session,
    },
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

export async function getReviewRecordAsync(reviewId: string, scope?: UserScope) {
  const memoryReview = getReviewRecord(reviewId, scope);

  if (memoryReview || !canPersistPracticeData()) {
    return memoryReview;
  }

  const review = await getDb().review.findFirst({
    where: {
      id: reviewId,
      ...(scope?.userId ? { session: { userId: scope.userId } } : {}),
    },
    include: {
      session: {
        select: {
          userId: true,
        },
      },
    },
  });

  return review ? persistedReviewToRecord(review) : null;
}

export function listReviewRecords(scope?: UserScope) {
  return Array.from(reviewRecords.values()).filter((review) =>
    scope?.userId ? getRecordUserId(review) === scope.userId : true,
  ).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function listReviewRecordsAsync(scope?: UserScope) {
  if (!canPersistPracticeData()) {
    return listReviewRecords(scope);
  }

  const reviews = await getDb().review.findMany({
    where: scope?.userId ? { session: { userId: scope.userId } } : undefined,
    include: {
      session: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(persistedReviewToRecord);
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
