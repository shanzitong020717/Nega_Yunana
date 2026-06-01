import { seedPhrases } from "@/data/seed-phrases";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";
import type { CreatePhraseInput } from "@/lib/validation/phrasebook";

export type PhraseRecord = CreatePhraseInput & {
  id: string;
  userId?: string;
  createdAt: string | null;
};

const savedPhrases: PhraseRecord[] = [];

function normalizeEnglish(english: string) {
  return english.trim().replace(/\s+/g, " ").toLowerCase();
}

function getRecordUserId(record: { userId?: string }) {
  return record.userId ?? LOCAL_DEMO_PROFILE_ID;
}

export function findPhraseRecordByEnglish(english: string, scope?: UserScope) {
  const normalizedEnglish = normalizeEnglish(english);
  const builtInPhrase = seedPhrases.find(
    (phrase) => normalizeEnglish(phrase.english) === normalizedEnglish,
  );

  if (builtInPhrase) {
    return {
      id: `built_in_${seedPhrases.indexOf(builtInPhrase) + 1}`,
      source: "built_in" as const,
      masteryStatus: "needs_practice" as const,
      createdAt: null,
      ...builtInPhrase,
    };
  }

  return (
    savedPhrases.find(
      (phrase) =>
        normalizeEnglish(phrase.english) === normalizedEnglish &&
        (!scope?.userId || getRecordUserId(phrase) === scope.userId),
    ) ?? null
  );
}

export function listPhraseRecords(scope?: UserScope) {
  return [
    ...seedPhrases.map((phrase, index) => ({
      id: `built_in_${index + 1}`,
      source: "built_in" as const,
      masteryStatus: "needs_practice" as const,
      createdAt: null,
      ...phrase,
    })),
    ...savedPhrases.filter((phrase) =>
      scope?.userId ? getRecordUserId(phrase) === scope.userId : true,
    ),
  ];
}

export function savePhraseRecord(input: CreatePhraseInput, scope?: UserScope) {
  const existingPhrase = findPhraseRecordByEnglish(input.english, scope);

  if (existingPhrase) {
    return {
      status: "duplicate" as const,
      phrase: existingPhrase,
    };
  }

  const phrase: PhraseRecord = {
    id: `phrase_${crypto.randomUUID()}`,
    userId: scope?.userId ?? LOCAL_DEMO_PROFILE_ID,
    createdAt: new Date().toISOString(),
    ...input,
  };

  savedPhrases.push(phrase);

  return {
    status: "created" as const,
    phrase,
  };
}
