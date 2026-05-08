import { NextResponse } from "next/server";

import { handleApiError, readJsonBody } from "@/lib/errors";
import {
  listPracticeSessionRecords,
  savePracticeSessionRecord,
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
    const practiceSession = savePracticeSessionRecord(input);

    return NextResponse.json(
      {
        practiceSession,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
