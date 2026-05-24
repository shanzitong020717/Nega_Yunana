import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import {
  listPhraseRecords,
  savePhraseRecord,
} from "@/lib/phrasebook/phrasebook-store";
import {
  createPhraseInputSchema,
} from "@/lib/validation/phrasebook";
import { handleApiError, readJsonBody } from "@/lib/errors";

export async function GET() {
  try {
    const authContext = await requireAuthContext();

    return NextResponse.json({
      phrases: listPhraseRecords({ userId: authContext.profileId }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const input = createPhraseInputSchema.parse(await readJsonBody(request));
    const result = savePhraseRecord(input, { userId: authContext.profileId });

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
