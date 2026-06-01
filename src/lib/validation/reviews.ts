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

export const conversationTurnIssueSchema = z.object({
  type: z.enum([
    "answer_relevance",
    "business_logic",
    "missing_detail",
    "overlong",
    "grammar",
    "word_choice",
    "naturalness",
    "tone",
  ]),
  severity: z.number().int().min(1).max(5),
  summaryZh: nonEmptyString("逐轮问题摘要不能为空"),
  evidence: nonEmptyString("逐轮问题证据不能为空"),
  suggestionZh: nonEmptyString("逐轮问题建议不能为空"),
});

export const betterConversationResponseSchema = z.object({
  english: nonEmptyString("推荐英文不能为空"),
  chinese: nonEmptyString("推荐中文不能为空"),
  reasonZh: nonEmptyString("推荐原因不能为空"),
});

export const conversationTurnReviewSchema = z.object({
  id: nonEmptyString("逐轮分析 ID 不能为空"),
  turnId: z.string().optional(),
  pairedTurnId: z.string().optional(),
  pairIndex: z.number().int().min(0),
  speaker: z.enum(["ai_customer", "user"]),
  text: nonEmptyString("对话内容不能为空"),
  translationZh: nonEmptyString("中文翻译不能为空"),
  timestamp: z.number().int().min(0),
  intentZh: nonEmptyString("对话意图不能为空"),
  roleInConversationZh: nonEmptyString("对话作用不能为空"),
  customerNeedZh: z.string().optional(),
  answerFit: z.enum(["good", "partial", "missed", "off_topic"]).optional(),
  answerFitReasonZh: z.string().optional(),
  strengths: z.array(z.string().min(1)).default([]),
  issues: z.array(conversationTurnIssueSchema).default([]),
  betterResponse: betterConversationResponseSchema.optional(),
  relatedSentenceReviewIds: z.array(z.string().min(1)).default([]),
  phrasebookCandidate: z
    .object({
      english: nonEmptyString("表达英文不能为空"),
      chinese: nonEmptyString("表达中文不能为空"),
      useCase: nonEmptyString("使用场景不能为空"),
      tags: z.array(z.string().min(1)).default([]),
    })
    .optional(),
});

export const conversationStageReviewSchema = z.object({
  stage: z.enum([
    "opening",
    "scenario_discovery",
    "value_positioning",
    "detail_answering",
    "objection_handling",
    "next_step",
  ]),
  labelZh: nonEmptyString("阶段名称不能为空"),
  status: z.enum(["completed", "partial", "missing"]),
  evidenceTurnIds: z.array(z.string().min(1)).default([]),
  summaryZh: nonEmptyString("阶段总结不能为空"),
  improvementZh: nonEmptyString("阶段建议不能为空"),
});

export const overallConversationFlowReviewSchema = z.object({
  answeredCustomerNeedsZh: z.array(z.string().min(1)).default([]),
  missedCustomerNeedsZh: z.array(z.string().min(1)).default([]),
  strongestMomentZh: nonEmptyString("最强表现不能为空"),
  weakestMomentZh: nonEmptyString("最弱表现不能为空"),
  nextConversationStrategyZh: nonEmptyString("下一次会谈策略不能为空"),
});

export const conversationReviewSchema = z.object({
  summaryZh: nonEmptyString("对话回放总结不能为空"),
  turns: z.array(conversationTurnReviewSchema).default([]),
  stages: z.array(conversationStageReviewSchema).default([]),
  overallFlow: overallConversationFlowReviewSchema,
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
  conversationReview: conversationReviewSchema.optional(),
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
export type ConversationTurnIssue = z.infer<
  typeof conversationTurnIssueSchema
>;
export type ConversationTurnReview = z.infer<
  typeof conversationTurnReviewSchema
>;
export type ConversationStageReview = z.infer<
  typeof conversationStageReviewSchema
>;
export type ConversationReview = z.infer<typeof conversationReviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type PracticeReviewPayload = z.infer<typeof createReviewInputSchema>;
