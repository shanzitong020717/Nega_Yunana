import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { handleApiError } from "@/lib/errors";
import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";

export async function GET() {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentTrainingCount = listPracticeSessionRecords(scope).filter(
      (session) => new Date(session.createdAt).getTime() >= sevenDaysAgo,
    ).length;
    const progress = getProgressSummary(recentTrainingCount, scope);
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
  } catch (error) {
    return handleApiError(error);
  }
}
