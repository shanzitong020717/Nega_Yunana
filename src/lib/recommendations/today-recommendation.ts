export type TodayRecommendation = {
  title: string;
  reason: string;
  goalLabel: string;
  personaLabel: string;
  voicePackLabel: string;
  materialLabel: string;
  durationMinutes: number;
  href: string;
};

export function getTodayRecommendation(): TodayRecommendation {
  return {
    title: "技术负责人 · 隐私与部署异议",
    reason:
      "推荐原因：你最近在回答隐私和部署问题时容易解释偏长，今天适合练习更短、更有推进力的回答。",
    goalLabel: "异议处理",
    personaLabel: "技术负责人",
    voicePackLabel: "Kore 坚定专业",
    materialLabel: "最近客户材料",
    durationMinutes: 8,
    href: "/practice",
  };
}
