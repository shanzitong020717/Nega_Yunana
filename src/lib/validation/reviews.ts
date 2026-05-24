import { z } from "zod";

import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import { suggestedAnswerRecordSchema } from "@/lib/validation/suggested-answer";
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

export const sentenceIssueSchema = z.object({
  type: z.enum([
    "grammar",
    "word_choice",
    "naturalness",
    "conciseness",
    "business_tone",
    "logic",
  ]),
  severity: z.number().int().min(1).max(5),
  originalFragment: nonEmptyString("原片段不能为空"),
  correction: nonEmptyString("修正表达不能为空"),
  explanationZh: nonEmptyString("中文解释不能为空"),
});

export const sentenceHighlightSchema = z.object({
  type: z.enum([
    "advanced_word",
    "business_tone",
    "good_structure",
    "synonym_usage",
    "clear_next_step",
    "customer_empathy",
  ]),
  text: nonEmptyString("亮点文本不能为空"),
  explanationZh: nonEmptyString("亮点解释不能为空"),
  alternatives: z.array(z.string().min(1)).default([]).optional(),
});

export const reviewVocabularyItemSchema = z.object({
  term: nonEmptyString("词汇不能为空"),
  phonetic: z.string().optional(),
  chinese: nonEmptyString("中文翻译不能为空"),
  example: nonEmptyString("例句不能为空"),
  sourceSentence: nonEmptyString("来源句子不能为空"),
});

export const sentenceReviewSchema = z.object({
  id: nonEmptyString("逐句复盘 ID 不能为空"),
  turnId: z.string().optional(),
  original: nonEmptyString("原句不能为空"),
  translationZh: nonEmptyString("中文意思不能为空"),
  quality: z.enum(["excellent", "good", "needs_improvement"]),
  grammarIssues: z.array(sentenceIssueSchema).default([]),
  wordChoiceIssues: z.array(sentenceIssueSchema).default([]),
  naturalnessIssues: z.array(sentenceIssueSchema).default([]),
  highlights: z.array(sentenceHighlightSchema).default([]),
  upgradedExpression: z.string().optional(),
  upgradedExpressionZh: z.string().optional(),
  reasonZh: nonEmptyString("复盘原因不能为空"),
  practicePrompt: nonEmptyString("练习提示不能为空"),
  vocabulary: z.array(reviewVocabularyItemSchema).default([]),
  phrasebookCandidate: z
    .object({
      english: nonEmptyString("表达英文不能为空"),
      chinese: nonEmptyString("表达中文不能为空"),
      useCase: nonEmptyString("使用场景不能为空"),
      tags: z.array(z.string().min(1)).default([]),
    })
    .optional(),
});

export const reviewSnapshotSchema = z.object({
  overallSummaryZh: nonEmptyString("复盘总评不能为空"),
  strengths: z.array(nonEmptyString("亮点不能为空")).min(1).max(3),
  priorityImprovements: z.array(nonEmptyString("改进点不能为空")).min(1).max(3),
  phrasebookCandidateCount: z.number().int().min(0),
  memoryCandidateCount: z.number().int().min(0),
  nextPracticeFocus: nonEmptyString("下次练习重点不能为空"),
});

export const memoryCandidateSchema = z.object({
  type: nonEmptyString("记忆类型不能为空"),
  title: nonEmptyString("记忆标题不能为空"),
  summary: nonEmptyString("记忆摘要不能为空"),
  evidence: z.array(z.string().min(1)).default([]),
  sensitivity: z.enum(["low", "medium", "high"], {
    error: "敏感度无效",
  }),
  confidence: z.number().min(0).max(1),
  importance: z.number().int().min(1).max(5).default(3),
  enabledForAi: z.boolean().default(true),
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
  reviewSnapshot: reviewSnapshotSchema.optional(),
  scores: businessScorecardSchema,
  topImprovements: z
    .array(nonEmptyString("改进点不能为空"))
    .min(1)
    .max(3),
  bestMoments: stringArraySchema,
  sentenceReviews: z.array(sentenceReviewSchema).default([]),
  sentenceUpgrades: z.array(sentenceUpgradeSchema).default([]),
  suggestedAnswers: z.array(suggestedAnswerRecordSchema).default([]).optional(),
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
export type SentenceIssue = z.infer<typeof sentenceIssueSchema>;
export type SentenceHighlight = z.infer<typeof sentenceHighlightSchema>;
export type ReviewVocabularyItem = z.infer<typeof reviewVocabularyItemSchema>;
export type SentenceReview = z.infer<typeof sentenceReviewSchema>;
export type ReviewSnapshot = z.infer<typeof reviewSnapshotSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type PracticeReviewPayload = z.infer<typeof createReviewInputSchema>;
