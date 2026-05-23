import type {
  CreatePracticeSessionInput,
  ResolvedPracticeContext,
} from "@/lib/validation/practice";

export type StoredPracticeSessionSelection = {
  difficulty?: CreatePracticeSessionInput["difficulty"];
  focusTags: string[];
  goalId: string;
  id: string;
  materialMode?: CreatePracticeSessionInput["materialMode"];
  materialId?: string;
  mode: CreatePracticeSessionInput["mode"];
  personaId: string;
  prepCardId?: string;
  scenarioPackId: string;
  sourceObjectionId?: string;
  trainingFocus: string[];
  voicePackId: string;
  resolvedContext?: ResolvedPracticeContext;
};

function storageKey(sessionId: string) {
  return `practice-session:${sessionId}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function isStoredPracticeSessionSelection(
  value: unknown,
): value is StoredPracticeSessionSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.scenarioPackId === "string" &&
    typeof record.goalId === "string" &&
    typeof record.mode === "string" &&
    typeof record.personaId === "string" &&
    typeof record.voicePackId === "string" &&
    Array.isArray(record.trainingFocus) &&
    Array.isArray(record.focusTags)
  );
}

export function savePracticeSessionSelection(
  practiceSession: StoredPracticeSessionSelection,
) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(
    storageKey(practiceSession.id),
    JSON.stringify(practiceSession),
  );
}

export function readPracticeSessionSelection(sessionId: string) {
  if (!canUseSessionStorage()) {
    return null;
  }

  const serializedSelection = window.sessionStorage.getItem(
    storageKey(sessionId),
  );

  if (!serializedSelection) {
    return null;
  }

  try {
    const parsedSelection = JSON.parse(serializedSelection) as unknown;

    if (!isStoredPracticeSessionSelection(parsedSelection)) {
      return null;
    }

    return parsedSelection.id === sessionId ? parsedSelection : null;
  } catch {
    return null;
  }
}
