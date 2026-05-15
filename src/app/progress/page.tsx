import type { Metadata } from "next";

import { ProgressView } from "@/features/progress/progress-view";
import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";

export const metadata: Metadata = {
  title: "复盘 | Rokid Coach",
};

export default function ProgressPage() {
  const recentTrainingCount = listPracticeSessionRecords().length;
  const progress = getProgressSummary(recentTrainingCount);

  return (
    <ProgressView
      progress={
        progress.topWeaknesses.length > 0
          ? progress
          : { ...getDefaultProgressSummary(), recentTrainingCount }
      }
    />
  );
}
