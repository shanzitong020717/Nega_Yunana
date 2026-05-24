import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { apiErrorResponse, handleApiError } from "@/lib/errors";
import { deletePracticeSessionRecord } from "@/lib/practice/practice-session-store";

type PracticeSessionRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: PracticeSessionRouteContext,
) {
  try {
    const authContext = await requireAuthContext();
    const { sessionId } = await context.params;
    const deleted = deletePracticeSessionRecord(sessionId, {
      userId: authContext.profileId,
    });

    if (!deleted) {
      return apiErrorResponse("NOT_FOUND", "未找到练习会话", 404);
    }

    return NextResponse.json({
      sessionId,
      deleted: true,
      transcriptDeleted: deleted.transcriptDeleted,
      reviewDeleted: deleted.reviewDeleted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
