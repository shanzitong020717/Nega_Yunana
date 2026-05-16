import { z } from "zod";

import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import { nonEmptyString, stringArraySchema } from "./shared";

const sentenceUpgradeBaseSchema = z.object({
  original: nonEmptyString("原句不能为空"),
  chineseExplanation: nonEmptyString("中文解释不能为空"),
  practicePrompt: nonEmptyString("练习提示不能为空"),
});

export const sentenceUpgradeSchema = z.discriminatedUnion("status", [
  sentenceUpgradeBaseSchema.extend({
    status: z.literal("needs_upgrade"),
    naturalEnglish: nonEmptyString("自然英文句子不能为空"),
  }),
  sentenceUpgradeBaseSchema.extend({
    status: z.literal("already_natural"),
    positiveFeedback: nonEmptyString("肯定反馈不能为空"),
  }),
]);

export const memoryCandidateSchema = z.object({
  type: nonEmptyString("记忆类型不能为空"),
  title: nonEmptyString("记忆标题不能为空"),
  summary: nonEmptyString("记忆摘要不能为空"),
  sensitivity: z.enum(["low", "medium", "high"], {
    error: "敏感度无效",
  }),
  confidence: z.number().min(0).max(1),
});

export const meetingOutcomeSchema = z.object({
  summary: nonEmptyString("会议结果总结不能为空"),
  customerReaction: nonEmptyString("客户反应不能为空"),
  nextStep: nonEmptyString("下一步不能为空"),
});

export const scoreItemSchema = z.object({
  score: z.number().int().min(1).max(5),
  rationale: nonEmptyString("评分理由不能为空"),
});

export const businessScorecardSchema = z.object({
  clarity: scoreItemSchema,
  businessConfidence: scoreItemSchema,
  discoverySkill: scoreItemSchema,
  productPositioning: scoreItemSchema,
  objectionHandling: scoreItemSchema,
  englishNaturalness: scoreItemSchema,
});

export const materialCoverageSchema = z.object({
  covered: stringArraySchema,
  missed: stringArraySchema,
  unclear: stringArraySchema,
});

export const objectionFrameworkStepSchema = z.enum([
  "Acknowledge",
  "Clarify",
  "Position",
  "Support",
  "Next Step",
]);

export const objectionFrameworkReviewSchema = z.object({
  requiredSteps: z.array(objectionFrameworkStepSchema).min(1),
  usedSteps: z.array(objectionFrameworkStepSchema).default([]),
  missingSteps: z.array(objectionFrameworkStepSchema).default([]),
  coachingNote: nonEmptyString("异议框架建议不能为空"),
});

export const weaknessUpdateInputSchema = z.object({
  type: z.enum(
    [
      "long_answers",
      "feature_only_talk",
      "weak_discovery",
      "unclear_positioning",
      "weak_objection_handling",
      "repetitive_vocabulary",
      "missing_next_step",
      "grammar_accuracy",
      "pronunciation_clarity",
      "fluency",
    ],
    {
      error: "弱项类型无效",
    },
  ),
  severity: z.number().int().min(1).max(5),
  evidence: nonEmptyString("弱项证据不能为空"),
  recommendedDrill: nonEmptyString("推荐练习不能为空"),
});

export const nextSessionRecommendationSchema = z.object({
  focus: nonEmptyString("下一次练习重点不能为空"),
  drill: nonEmptyString("下一次练习项目不能为空"),
  prompt: nonEmptyString("下一次练习提示不能为空"),
});

export const createReviewInputSchema = z.object({
  meetingOutcome: meetingOutcomeSchema,
  scores: businessScorecardSchema,
  topImprovements: z
    .array(nonEmptyString("改进点不能为空"))
    .min(1)
    .max(3),
  bestMoments: stringArraySchema,
  sentenceUpgrades: z.array(sentenceUpgradeSchema).default([]),
  materialCoverage: materialCoverageSchema,
  objectionFramework: objectionFrameworkReviewSchema.optional(),
  phrasebookSuggestions: z.array(createPhraseInputSchema).default([]),
  weaknessUpdates: z.array(weaknessUpdateInputSchema).default([]),
  memoryCandidates: z.array(memoryCandidateSchema).default([]),
  nextSessionRecommendation: nextSessionRecommendationSchema,
});

export type ObjectionFrameworkStep = z.infer<typeof objectionFrameworkStepSchema>;
export type ObjectionFrameworkReview = z.infer<
  typeof objectionFrameworkReviewSchema
>;
export type WeaknessUpdateInput = z.infer<typeof weaknessUpdateInputSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type PracticeReviewPayload = z.infer<typeof createReviewInputSchema>;
