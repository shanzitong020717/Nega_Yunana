import { NextResponse } from "next/server";

import { personas } from "@/data/personas";
import { requireAuthContext } from "@/lib/auth/require-user";
import {
  generatePracticeReview,
  ReviewGenerationRetryableError,
} from "@/lib/ai/review";
import { apiErrorResponse, handleApiError } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import {
  deleteReviewBySessionId,
  ensurePracticeSessionRecord,
  getPracticeSessionRecord,
  getSuggestedAnswerRecords,
  getTranscriptTurns,
  saveReviewRecord,
} from "@/lib/practice/practice-session-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import { createReviewInputSchema } from "@/lib/validation/reviews";

type ReviewRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function readOptionalJsonBody(request: Request) {
  const text = await request.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SyntaxError("请求体必须是有效 JSON");
  }
}

export async function POST(request: Request, context: ReviewRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const { sessionId } = await context.params;
    const requestBody = await readOptionalJsonBody(request);
    const practiceSession = ensurePracticeSessionRecord(sessionId, scope);
    const persona =
      personas.find((item) => item.id === practiceSession.personaId) ??
      personas[0];
    const materialBrief = practiceSession.materialId
      ? getMaterialBriefRecord(practiceSession.materialId)
      : null;
    const prepCard = practiceSession.prepCardId
      ? getPrepCardRecord(practiceSession.prepCardId, scope)
      : null;
    const review = requestBody
      ? createReviewInputSchema.parse(requestBody)
      : await generatePracticeReview({
          practiceSession,
          transcriptTurns: getTranscriptTurns(sessionId, scope),
          persona,
          materialBrief,
          prepCard,
          suggestedAnswers: getSuggestedAnswerRecords(sessionId, scope),
        });
    const reviewRecord = saveReviewRecord(sessionId, review, scope);

    return NextResponse.json(
      {
        reviewId: reviewRecord.id,
        sessionId,
        review,
        ...review,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReviewGenerationRetryableError) {
      return apiErrorResponse("RETRYABLE_AI_OUTPUT", error.message, 422);
    }

    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: ReviewRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const { sessionId } = await context.params;

    if (!getPracticeSessionRecord(sessionId, { userId: authContext.profileId })) {
      return apiErrorResponse("NOT_FOUND", "未找到练习会话", 404);
    }

    const deletedReview = deleteReviewBySessionId(sessionId, {
      userId: authContext.profileId,
    });

    return NextResponse.json({
      sessionId,
      deleted: true,
      reviewDeleted: Boolean(deletedReview),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
