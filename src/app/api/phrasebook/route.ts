import { NextResponse } from "next/server";

import {
  listPhraseRecords,
  savePhraseRecord,
} from "@/lib/phrasebook/phrasebook-store";
import {
  createPhraseInputSchema,
} from "@/lib/validation/phrasebook";
import { handleApiError, readJsonBody } from "@/lib/errors";

export function GET() {
  return NextResponse.json({
    phrases: listPhraseRecords(),
  });
}

export async function POST(request: Request) {
  try {
    const input = createPhraseInputSchema.parse(await readJsonBody(request));
    const result = savePhraseRecord(input);

    if (result.status === "duplicate") {
      return NextResponse.json(
        {
          status: "duplicate",
          phrase: result.phrase,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        phrase: result.phrase,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
