import { NextResponse } from "next/server";

import { seedPhrases } from "@/data/seed-phrases";
import {
  createPhraseInputSchema,
  type CreatePhraseInput,
} from "@/lib/validation/phrasebook";
import { handleApiError, readJsonBody } from "@/lib/errors";

type MockPhrase = CreatePhraseInput & {
  id: string;
  createdAt: string;
};

const savedPhrases: MockPhrase[] = [];

function normalizeEnglish(english: string) {
  return english.trim().replace(/\s+/g, " ").toLowerCase();
}

function findExistingPhrase(english: string) {
  const normalizedEnglish = normalizeEnglish(english);
  const builtInPhrase = seedPhrases.find(
    (phrase) => normalizeEnglish(phrase.english) === normalizedEnglish,
  );

  if (builtInPhrase) {
    return {
      id: `built_in_${seedPhrases.indexOf(builtInPhrase) + 1}`,
      source: "built_in",
      masteryStatus: "needs_practice",
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

export function GET() {
  return NextResponse.json({
    phrases: [
      ...seedPhrases.map((phrase, index) => ({
        id: `built_in_${index + 1}`,
        source: "built_in",
        masteryStatus: "needs_practice",
        createdAt: null,
        ...phrase,
      })),
      ...savedPhrases,
    ],
  });
}

export async function POST(request: Request) {
  try {
    const input = createPhraseInputSchema.parse(await readJsonBody(request));
    const existingPhrase = findExistingPhrase(input.english);

    if (existingPhrase) {
      return NextResponse.json(
        {
          status: "duplicate",
          phrase: existingPhrase,
        },
        { status: 200 },
      );
    }

    const phrase: MockPhrase = {
      id: `phrase_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };

    savedPhrases.push(phrase);

    return NextResponse.json(
      {
        phrase,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
