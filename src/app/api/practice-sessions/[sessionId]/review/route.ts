import { NextResponse } from "next/server";

import { personas } from "@/data/personas";
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
    const { sessionId } = await context.params;
    const requestBody = await readOptionalJsonBody(request);
    const practiceSession = ensurePracticeSessionRecord(sessionId);
    const persona =
      personas.find((item) => item.id === practiceSession.personaId) ??
      personas[0];
    const materialBrief = practiceSession.materialId
      ? getMaterialBriefRecord(practiceSession.materialId)
      : null;
    const prepCard = practiceSession.prepCardId
      ? getPrepCardRecord(practiceSession.prepCardId)
      : null;
    const review = requestBody
      ? createReviewInputSchema.parse(requestBody)
      : await generatePracticeReview({
          practiceSession,
          transcriptTurns: getTranscriptTurns(sessionId),
          persona,
          materialBrief,
          prepCard,
        });
    const reviewRecord = saveReviewRecord(sessionId, review);

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
    const { sessionId } = await context.params;

    if (!getPracticeSessionRecord(sessionId)) {
      return apiErrorResponse("NOT_FOUND", "未找到练习会话", 404);
    }

    const deletedReview = deleteReviewBySessionId(sessionId);

    return NextResponse.json({
      sessionId,
      deleted: true,
      reviewDeleted: Boolean(deletedReview),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
