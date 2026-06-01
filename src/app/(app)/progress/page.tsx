import type { Metadata } from "next";

import { ProgressView } from "@/features/progress/progress-view";
import { requireAuthContext } from "@/lib/auth/require-user";
import {
  listPracticeSessionRecordsAsync,
  listReviewRecordsAsync,
} from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";
import { getOrGenerateReviewAnalytics } from "@/lib/progress/review-analytics-store";

export const metadata: Metadata = {
  title: "复盘 | Rokid Coach",
};

export default async function ProgressPage() {
  const authContext = await requireAuthContext();
  const scope = { userId: authContext.profileId };
  const [practiceSessions, reviewRecords] = await Promise.all([
    listPracticeSessionRecordsAsync(scope),
    listReviewRecordsAsync(scope),
  ]);
  const recentTrainingCount = practiceSessions.length;
  const progress = getProgressSummary(recentTrainingCount, scope);
  const analytics = await getOrGenerateReviewAnalytics({
    range: "7d",
    userId: scope.userId,
  });

  return (
    <ProgressView
      analytics={analytics.trainingCount >= 2 ? analytics : null}
      reviewHistory={reviewRecords.map((review) => ({
        id: review.id,
        sessionId: review.sessionId,
        createdAt: review.createdAt,
        summary: review.meetingOutcome.summary,
      }))}
      progress={
        progress.topWeaknesses.length > 0
          ? progress
          : { ...getDefaultProgressSummary(), recentTrainingCount }
      }
    />
  );
}
