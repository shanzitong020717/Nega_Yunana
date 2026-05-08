import { DashboardView } from "@/features/dashboard/dashboard-view";
import { listPracticeSessionRecords } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";

export default function DashboardPage() {
  const recentTrainingCount = listPracticeSessionRecords().length;
  const progress = getProgressSummary(recentTrainingCount);

  return (
    <DashboardView
      progress={
        progress.topWeaknesses.length > 0
          ? progress
          : { ...getDefaultProgressSummary(), recentTrainingCount }
      }
    />
  );
}
