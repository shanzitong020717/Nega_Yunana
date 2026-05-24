import type { Metadata } from "next";

import { ProgressView } from "@/features/progress/progress-view";
import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";
import { getOrGenerateReviewAnalytics } from "@/lib/progress/review-analytics-store";

export const metadata: Metadata = {
  title: "复盘 | Rokid Coach",
};

export default async function ProgressPage() {
  const recentTrainingCount = listPracticeSessionRecords().length;
  const progress = getProgressSummary(recentTrainingCount);
  const analytics = await getOrGenerateReviewAnalytics({ range: "7d" });

  return (
    <ProgressView
      analytics={analytics.trainingCount >= 2 ? analytics : null}
      progress={
        progress.topWeaknesses.length > 0
          ? progress
          : { ...getDefaultProgressSummary(), recentTrainingCount }
      }
    />
  );
}
