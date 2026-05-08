import { NextResponse } from "next/server";

import { apiErrorResponse, handleApiError, readJsonBody } from "@/lib/errors";
import {
  deleteTranscriptTurns,
  getPracticeSessionRecord,
  saveTranscriptTurns,
} from "@/lib/practice/practice-session-store";
import { saveTranscriptInputSchema } from "@/lib/validation/practice";

type TranscriptRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(request: Request, context: TranscriptRouteContext) {
  try {
    const { sessionId } = await context.params;
    const input = saveTranscriptInputSchema.parse(await readJsonBody(request));
    const savedTurns = saveTranscriptTurns(sessionId, input.turns);

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
    const { sessionId } = await context.params;

    if (!getPracticeSessionRecord(sessionId)) {
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
