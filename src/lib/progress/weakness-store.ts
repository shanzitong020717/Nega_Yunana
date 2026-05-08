import type { WeaknessUpdateInput } from "@/lib/validation/reviews";

export type WeaknessMetric = WeaknessUpdateInput & {
  id: string;
  label: string;
  occurrences: number;
  lastSeenAt: string;
};

export type WeaknessHistoryItem = WeaknessUpdateInput & {
  id: string;
  sessionId: string;
  label: string;
  createdAt: string;
};

export type ProgressSummary = {
  recentTrainingCount: number;
  topWeaknesses: WeaknessMetric[];
  improvedWeaknesses: WeaknessMetric[];
  recommendedDrills: string[];
  history: WeaknessHistoryItem[];
};

export const weaknessLabels: Record<WeaknessUpdateInput["type"], string> = {
  long_answers: "回答过长",
  feature_only_talk: "只讲功能",
  weak_discovery: "探索提问不足",
  unclear_positioning: "定位不清晰",
  weak_objection_handling: "异议处理偏弱",
  repetitive_vocabulary: "词汇重复",
  missing_next_step: "缺少下一步",
  grammar_accuracy: "语法准确性",
  pronunciation_clarity: "发音清晰度",
  fluency: "流利度",
};

const weaknessMetrics = new Map<WeaknessUpdateInput["type"], WeaknessMetric>();
const weaknessHistory: WeaknessHistoryItem[] = [];

export function upsertWeaknessUpdates(
  sessionId: string,
  updates: WeaknessUpdateInput[],
) {
  const now = new Date().toISOString();

  updates.forEach((update) => {
    const existingMetric = weaknessMetrics.get(update.type);
    const metric: WeaknessMetric = {
      id: existingMetric?.id ?? `weakness_${update.type}`,
      label: weaknessLabels[update.type],
      occurrences: (existingMetric?.occurrences ?? 0) + 1,
      lastSeenAt: now,
      ...update,
    };

    weaknessMetrics.set(update.type, metric);
    weaknessHistory.unshift({
      id: `weakness_history_${crypto.randomUUID()}`,
      sessionId,
      label: weaknessLabels[update.type],
      createdAt: now,
      ...update,
    });
  });
}

export function listWeaknessMetrics() {
  return Array.from(weaknessMetrics.values()).sort((left, right) => {
    if (right.severity !== left.severity) {
      return right.severity - left.severity;
    }

    return right.occurrences - left.occurrences;
  });
}

export function getProgressSummary(recentTrainingCount: number): ProgressSummary {
  const metrics = listWeaknessMetrics();
  const topWeaknesses = metrics.slice(0, 3);
  const improvedWeaknesses = metrics
    .filter((metric) => metric.severity <= 2)
    .slice(0, 3);
  const recommendedDrills = Array.from(
    new Set(topWeaknesses.map((metric) => metric.recommendedDrill)),
  );

  return {
    recentTrainingCount,
    topWeaknesses,
    improvedWeaknesses,
    recommendedDrills,
    history: weaknessHistory.slice(0, 8),
  };
}

export function getDefaultProgressSummary(): ProgressSummary {
  return {
    recentTrainingCount: 0,
    topWeaknesses: [
      {
        id: "weakness_feature_value",
        type: "feature_only_talk",
      label: "只讲功能",
        severity: 3,
        evidence:
        "Mock baseline: practice sessions should track whether product features are connected to customer value.",
        recommendedDrill: "功能转价值练习",
        occurrences: 1,
        lastSeenAt: new Date(0).toISOString(),
      },
    ],
    improvedWeaknesses: [],
    recommendedDrills: ["功能转价值练习"],
    history: [],
  };
}
