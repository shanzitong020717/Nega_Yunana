import { NextResponse } from "next/server";

import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";

export function GET() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentTrainingCount = listPracticeSessionRecords().filter(
    (session) => new Date(session.createdAt).getTime() >= sevenDaysAgo,
  ).length;
  const progress = getProgressSummary(recentTrainingCount);
  const summary =
    progress.topWeaknesses.length > 0
      ? progress
      : {
          ...getDefaultProgressSummary(),
          recentTrainingCount,
        };

  return NextResponse.json({
    weaknesses: summary.topWeaknesses,
    ...summary,
  });
}
