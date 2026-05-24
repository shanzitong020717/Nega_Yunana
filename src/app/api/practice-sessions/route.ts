import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
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
  return requireAuthContext()
    .then((authContext) =>
      NextResponse.json({
        practiceSessions: listPracticeSessionRecords({
          userId: authContext.profileId,
        }),
      }),
    )
    .catch((error) => handleApiError(error));
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const input = createPracticeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const practiceSession = createResolvedPracticeSession({
      ...input,
      userId: authContext.profileId,
    });

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
