import { NextResponse } from "next/server";

import { listMaterialRecords } from "@/lib/materials/material-store";
import { rankMemoriesForPractice } from "@/lib/memory/memory-store";
import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";
import { getCachedReviewAnalytics } from "@/lib/progress/review-analytics-store";
import { generateTodayRecommendation } from "@/lib/recommendations/today-recommendation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const excludedRecommendationIds = url.searchParams
    .getAll("exclude")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const recentTrainingCount = listPracticeSessionRecords().length;
  const progress = getProgressSummary(recentTrainingCount);
  const resolvedProgress =
    progress.topWeaknesses.length > 0
      ? progress
      : { ...getDefaultProgressSummary(), recentTrainingCount };
  const focusTags = resolvedProgress.topWeaknesses.flatMap((weakness) => [
    weakness.label,
    weakness.recommendedDrill,
  ]);
  const recommendation = await generateTodayRecommendation({
    progress: resolvedProgress,
    recentMaterials: listMaterialRecords().slice(0, 5),
    memories: rankMemoriesForPractice({ focusTags, limit: 6 }),
    analytics: getCachedReviewAnalytics("7d"),
    excludedRecommendationIds,
    mockMode: url.searchParams.get("mock") === "1",
  });

  return NextResponse.json({ recommendation });
}
