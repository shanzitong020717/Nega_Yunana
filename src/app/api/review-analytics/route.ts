import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { apiErrorResponse, handleApiError } from "@/lib/errors";
import { getOrGenerateReviewAnalytics } from "@/lib/progress/review-analytics-store";
import { reviewAnalyticsRangeSchema } from "@/lib/validation/review-analytics";

const refreshBodySchema = z
  .object({
    range: reviewAnalyticsRangeSchema.default("7d"),
  })
  .default({
    range: "7d",
  });

function parseRangeFromRequest(request: Request) {
  const url = new URL(request.url);
  const rawRange = url.searchParams.get("range") ?? "7d";
  return reviewAnalyticsRangeSchema.parse(rawRange);
}

export async function GET(request: Request) {
  try {
    const range = parseRangeFromRequest(request);
    const analytics = await getOrGenerateReviewAnalytics({ range });

    return NextResponse.json({
      analytics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiErrorResponse(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "长期复盘范围无效",
        400,
      );
    }

    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text.trim() ? JSON.parse(text) : {};
    const input = refreshBodySchema.parse(body);
    const analytics = await getOrGenerateReviewAnalytics({
      range: input.range,
      force: true,
    });

    return NextResponse.json({
      analytics,
      refreshed: true,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return handleApiError(error);
    }

    if (error instanceof ZodError) {
      return apiErrorResponse(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "长期复盘范围无效",
        400,
      );
    }

    return handleApiError(error);
  }
}
