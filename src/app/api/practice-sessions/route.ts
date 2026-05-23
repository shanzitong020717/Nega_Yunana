import { NextResponse } from "next/server";

import { apiErrorResponse, handleApiError, readJsonBody } from "@/lib/errors";
import {
  createResolvedPracticeSession,
  PracticeSessionCreationError,
} from "@/lib/practice/create-practice-session";
import {
  listPracticeSessionRecords,
} from "@/lib/practice/practice-session-store";
import { createPracticeSessionInputSchema } from "@/lib/validation/practice";

export function GET() {
  return NextResponse.json({
    practiceSessions: listPracticeSessionRecords(),
  });
}

export async function POST(request: Request) {
  try {
    const input = createPracticeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const practiceSession = createResolvedPracticeSession(input);

    return NextResponse.json(
      {
        practiceSession,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PracticeSessionCreationError) {
      return apiErrorResponse("VALIDATION_ERROR", error.message, error.status);
    }

    return handleApiError(error);
  }
}
