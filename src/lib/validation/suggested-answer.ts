import { z } from "zod";

import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import {
  createPracticeSessionInputSchema,
  transcriptTurnInputSchema,
} from "@/lib/validation/practice";
import { nonEmptyString, optionalString } from "@/lib/validation/shared";

export const suggestedAnswerAiTurnSchema = z.object({
  speaker: z.literal("ai_customer"),
  text: nonEmptyString("AI 问题不能为空"),
  translationZh: optionalString,
  timestamp: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const suggestedAnswerQuestionSchema = z.object({
  english: nonEmptyString("AI 英文问题不能为空"),
  translationZh: nonEmptyString("AI 问题中文翻译不能为空"),
});

export const suggestedReplySchema = z.object({
  english: nonEmptyString("建议回复英文不能为空"),
  chinese: nonEmptyString("建议回复中文不能为空"),
  reason: nonEmptyString("建议原因不能为空"),
});

export const suggestedResponseStrategySchema = z.object({
  english: nonEmptyString("英文回应策略不能为空"),
  chinese: nonEmptyString("中文回应策略不能为空"),
});

export const suggestedLogicBreakdownSchema = z.object({
  surfaceMeaningZh: nonEmptyString("表层语义不能为空"),
  customerIntentZh: nonEmptyString("客户意图不能为空"),
  informationNeededZh: nonEmptyString("客户想确认的信息不能为空"),
  responseFocusZh: nonEmptyString("回应重点不能为空"),
});

export const suggestedContextBreakdownSchema = z.object({
  conversationStateZh: nonEmptyString("当前对话状态不能为空"),
  customerQuestionReasonZh: nonEmptyString("客户提问原因不能为空"),
  priorUserAnswerZh: nonEmptyString("用户前文回答不能为空"),
  missingInformationZh: nonEmptyString("缺失信息不能为空"),
  responseBoundaryZh: nonEmptyString("回答边界不能为空"),
});

export const suggestedVocabularySchema = z.object({
  term: nonEmptyString("词汇不能为空"),
  phonetic: nonEmptyString("音标不能为空"),
  chinese: nonEmptyString("词汇中文不能为空"),
  example: optionalString,
});

export const suggestedAnswerCoreSchema = z.object({
  aiQuestion: suggestedAnswerQuestionSchema,
  analysis: nonEmptyString("回应分析不能为空"),
  responseStrategy: suggestedResponseStrategySchema,
  contextBreakdown: suggestedContextBreakdownSchema,
  logicBreakdown: suggestedLogicBreakdownSchema,
  suggestedReplies: z.array(suggestedReplySchema).min(1).max(3),
  vocabulary: z.array(suggestedVocabularySchema).min(2).max(4).default([]),
  phrasebookEntry: createPhraseInputSchema,
});

export const suggestedAnswerRecordSchema = suggestedAnswerCoreSchema.extend({
  id: nonEmptyString("建议回答 ID 不能为空"),
  createdAt: nonEmptyString("建议回答创建时间不能为空"),
});

export const createSuggestedAnswerInputSchema = z.object({
  practiceSession: createPracticeSessionInputSchema,
  latestAiTurn: suggestedAnswerAiTurnSchema,
  transcriptTurns: z.array(transcriptTurnInputSchema).default([]),
});

export type SuggestedAnswerAiTurn = z.infer<
  typeof suggestedAnswerAiTurnSchema
>;
export type SuggestedAnswerCore = z.infer<typeof suggestedAnswerCoreSchema>;
export type SuggestedAnswerRecord = z.infer<typeof suggestedAnswerRecordSchema>;
export type CreateSuggestedAnswerInput = z.infer<
  typeof createSuggestedAnswerInputSchema
>;
