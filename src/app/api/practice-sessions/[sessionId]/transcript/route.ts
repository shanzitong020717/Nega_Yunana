import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { apiErrorResponse, handleApiError, readJsonBody } from "@/lib/errors";
import {
  deleteTranscriptTurns,
  getPracticeSessionRecord,
  saveTranscriptTurnsAsync,
} from "@/lib/practice/practice-session-store";
import { saveTranscriptInputSchema } from "@/lib/validation/practice";

type TranscriptRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(request: Request, context: TranscriptRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const { sessionId } = await context.params;
    const input = saveTranscriptInputSchema.parse(await readJsonBody(request));
    const savedTurns = await saveTranscriptTurnsAsync(sessionId, input.turns, {
      userId: authContext.profileId,
    });

    return NextResponse.json(
      {
        sessionId,
        turnCount: savedTurns.length,
        status: "saved",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: TranscriptRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const { sessionId } = await context.params;

    if (!getPracticeSessionRecord(sessionId, { userId: authContext.profileId })) {
      return apiErrorResponse("NOT_FOUND", "未找到练习会话", 404);
    }

    const deleted = deleteTranscriptTurns(sessionId);

    return NextResponse.json({
      sessionId,
      deleted: true,
      transcriptDeleted: deleted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
