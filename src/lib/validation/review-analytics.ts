import { z } from "zod";

import { nonEmptyString } from "@/lib/validation/shared";

export const reviewAnalyticsRangeSchema = z.enum(["7d", "30d", "all"], {
  error: "长期复盘范围无效",
});

const evidenceSchema = z.array(nonEmptyString("证据不能为空")).default([]);

export const growthSignalSchema = z.object({
  id: nonEmptyString("成长信号 ID 不能为空"),
  title: nonEmptyString("成长标题不能为空"),
  summaryZh: nonEmptyString("成长总结不能为空"),
  evidence: evidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const recurringMistakeSchema = z.object({
  id: nonEmptyString("错误 ID 不能为空"),
  category: z.enum([
    "grammar",
    "word_choice",
    "naturalness",
    "conciseness",
    "business_tone",
    "logic",
    "strategy",
  ]),
  title: nonEmptyString("错误标题不能为空"),
  occurrenceCount: z.number().int().min(1),
  averageSeverity: z.number().min(1).max(5),
  lastSeenAt: z.string().datetime({ error: "最近出现时间无效" }),
  examples: z
    .array(
      z.object({
        reviewId: nonEmptyString("复盘 ID 不能为空"),
        sessionId: nonEmptyString("会话 ID 不能为空"),
        original: nonEmptyString("原句不能为空"),
        correction: nonEmptyString("修正表达不能为空"),
        explanationZh: nonEmptyString("解释不能为空"),
      }),
    )
    .default([]),
  recommendedDrill: nonEmptyString("推荐练习不能为空"),
});

export const naturalnessPatternSchema = z.object({
  id: nonEmptyString("自然度模式 ID 不能为空"),
  title: nonEmptyString("自然度标题不能为空"),
  patternZh: nonEmptyString("模式说明不能为空"),
  betterExpression: nonEmptyString("更自然表达不能为空"),
  examples: evidenceSchema,
});

export const phraseGrowthSchema = z.object({
  newPhraseCount: z.number().int().min(0),
  reviewGeneratedPhraseCount: z.number().int().min(0),
  vocabularyItems: z
    .array(
      z.object({
        term: nonEmptyString("词汇不能为空"),
        chinese: nonEmptyString("中文不能为空"),
        example: nonEmptyString("例句不能为空"),
        count: z.number().int().min(1),
      }),
    )
    .default([]),
  reusableSentences: z
    .array(
      z.object({
        english: nonEmptyString("英文表达不能为空"),
        chinese: nonEmptyString("中文表达不能为空"),
        useCase: nonEmptyString("使用场景不能为空"),
      }),
    )
    .default([]),
});

export const memoryInsightSchema = z.object({
  id: nonEmptyString("记忆洞察 ID 不能为空"),
  type: z.enum([
    "new_memory",
    "reinforced_memory",
    "conflicting_memory",
    "stale_memory",
  ]),
  title: nonEmptyString("记忆标题不能为空"),
  summaryZh: nonEmptyString("记忆总结不能为空"),
  evidence: evidenceSchema,
  action: z.enum(["keep", "merge", "disable", "review_manually"]),
});

export const nextTrainingPlanSchema = z.object({
  title: nonEmptyString("训练标题不能为空"),
  reasonZh: nonEmptyString("推荐原因不能为空"),
  goalId: nonEmptyString("训练目标不能为空"),
  mode: nonEmptyString("训练模式不能为空"),
  personaId: nonEmptyString("客户角色不能为空"),
  voicePackId: nonEmptyString("音色不能为空"),
  materialMode: z.enum(["recent_material", "no_material", "memory_context"]),
  focusTags: z.array(nonEmptyString("训练重点不能为空")).min(1),
  estimatedMinutes: z.number().int().min(1).max(30),
});

export const reviewAnalyticsSnapshotSchema = z.object({
  id: nonEmptyString("长期复盘 ID 不能为空"),
  range: reviewAnalyticsRangeSchema,
  generatedAt: z.string().datetime({ error: "生成时间无效" }),
  staleAfter: z.string().datetime({ error: "过期时间无效" }),
  sourceReviewIds: z.array(nonEmptyString("复盘 ID 不能为空")).default([]),
  sourceSessionIds: z.array(nonEmptyString("会话 ID 不能为空")).default([]),
  trainingCount: z.number().int().min(0),
  summaryZh: nonEmptyString("长期复盘总结不能为空"),
  topGrowthSignals: z.array(growthSignalSchema).default([]),
  recurringMistakes: z.array(recurringMistakeSchema).default([]),
  naturalnessPatterns: z.array(naturalnessPatternSchema).default([]),
  phraseGrowth: phraseGrowthSchema,
  memoryInsights: z.array(memoryInsightSchema).default([]),
  nextTrainingPlan: nextTrainingPlanSchema,
  aiGenerated: z.boolean(),
});

export type ReviewAnalyticsRange = z.infer<typeof reviewAnalyticsRangeSchema>;
export type GrowthSignal = z.infer<typeof growthSignalSchema>;
export type RecurringMistake = z.infer<typeof recurringMistakeSchema>;
export type NaturalnessPattern = z.infer<typeof naturalnessPatternSchema>;
export type PhraseGrowth = z.infer<typeof phraseGrowthSchema>;
export type MemoryInsight = z.infer<typeof memoryInsightSchema>;
export type NextTrainingPlan = z.infer<typeof nextTrainingPlanSchema>;
export type ReviewAnalyticsSnapshot = z.infer<
  typeof reviewAnalyticsSnapshotSchema
>;
