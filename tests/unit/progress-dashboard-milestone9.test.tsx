import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "@/features/dashboard/dashboard-view";
import { ProgressView } from "@/features/progress/progress-view";
import type { ProgressSummary } from "@/lib/progress/weakness-store";

const progressSummary: ProgressSummary = {
  recentTrainingCount: 3,
  topWeaknesses: [
    {
      id: "weakness_weak_discovery",
      type: "weak_discovery",
      label: "Weak Discovery",
      severity: 4,
      evidence: "The learner answered before clarifying workflow.",
      recommendedDrill: "Use-case discovery ladder",
      lastSeenAt: new Date().toISOString(),
      occurrences: 2,
    },
  ],
  improvedWeaknesses: [
    {
      id: "weakness_feature_only_talk",
      type: "feature_only_talk",
      label: "Feature-Only Talk",
      severity: 2,
      evidence: "Recent answers connect captions to customer outcomes.",
      recommendedDrill: "Feature-to-value conversion drill",
      lastSeenAt: new Date().toISOString(),
      occurrences: 1,
    },
  ],
  recommendedDrills: ["Use-case discovery ladder"],
  history: [
    {
      id: "history_1",
      sessionId: "session_123",
      type: "weak_discovery",
      label: "Weak Discovery",
      severity: 4,
      evidence: "The learner answered before clarifying workflow.",
      recommendedDrill: "Use-case discovery ladder",
      createdAt: new Date().toISOString(),
    },
  ],
};

describe("milestone 9 progress surfaces", () => {
  it("renders the full progress summary from weakness data", () => {
    render(<ProgressView progress={progressSummary} />);

    expect(screen.getByText("近 7 天训练次数")).toBeInTheDocument();
    expect(screen.getByText("3 次会话")).toBeInTheDocument();
    expect(screen.getByText("主要弱项")).toBeInTheDocument();
    expect(screen.getByText("已有改善的弱项")).toBeInTheDocument();
    expect(screen.getByText("推荐练习")).toBeInTheDocument();
    expect(screen.getByText("历史记录")).toBeInTheDocument();
    expect(screen.getAllByText("Weak Discovery").length).toBeGreaterThan(0);
  });

  it("shows this week's focus from weakness recommendations on the dashboard", () => {
    render(<DashboardView progress={progressSummary} />);

    expect(screen.getByText("本周重点")).toBeInTheDocument();
    expect(screen.getAllByText("Use-case discovery ladder").length).toBeGreaterThan(0);
  });
});
