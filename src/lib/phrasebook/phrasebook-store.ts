import { seedPhrases } from "@/data/seed-phrases";
import type { CreatePhraseInput } from "@/lib/validation/phrasebook";

export type PhraseRecord = CreatePhraseInput & {
  id: string;
  createdAt: string | null;
};

const savedPhrases: PhraseRecord[] = [];

function normalizeEnglish(english: string) {
  return english.trim().replace(/\s+/g, " ").toLowerCase();
}

export function findPhraseRecordByEnglish(english: string) {
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
      (phrase) => normalizeEnglish(phrase.english) === normalizedEnglish,
    ) ?? null
  );
}

export function listPhraseRecords() {
  return [
    ...seedPhrases.map((phrase, index) => ({
      id: `built_in_${index + 1}`,
      source: "built_in" as const,
      masteryStatus: "needs_practice" as const,
      createdAt: null,
      ...phrase,
    })),
    ...savedPhrases,
  ];
}

export function savePhraseRecord(input: CreatePhraseInput) {
  const existingPhrase = findPhraseRecordByEnglish(input.english);

  if (existingPhrase) {
    return {
      status: "duplicate" as const,
      phrase: existingPhrase,
    };
  }

  const phrase: PhraseRecord = {
    id: `phrase_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };

  savedPhrases.push(phrase);

  return {
    status: "created" as const,
    phrase,
  };
}
