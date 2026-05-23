import { z } from "zod";

import {
  createPracticeSessionInputSchema,
  transcriptTurnInputSchema,
} from "@/lib/validation/practice";
import { nonEmptyString, optionalString } from "@/lib/validation/shared";

export const supportCueSchema = z.enum(
  [
    "Better Phrase",
    "Use Material Point",
    "Ask a Discovery Question",
    "Challenge Me",
  ],
  {
    error: "提示类型无效",
  },
);

export const supportCueResultSectionSchema = z.object({
  label: nonEmptyString("提示分区标题不能为空"),
  english: optionalString,
  chinese: optionalString,
  note: optionalString,
});

export const supportCueVocabularySchema = z.object({
  term: nonEmptyString("词汇不能为空"),
  phonetic: nonEmptyString("音标不能为空"),
  chinese: nonEmptyString("词汇中文不能为空"),
  example: nonEmptyString("词汇例句不能为空"),
});

export const supportCueResultSchema = z.object({
  id: nonEmptyString("提示结果 ID 不能为空"),
  title: nonEmptyString("提示标题不能为空"),
  badge: nonEmptyString("提示标签不能为空"),
  sections: z.array(supportCueResultSectionSchema).min(2),
  vocabulary: z.array(supportCueVocabularySchema).default([]),
});

export const smartGuidanceSchema = z.object({
  currentJudgment: nonEmptyString("当前判断不能为空"),
  nextStep: nonEmptyString("下一步不能为空"),
  riskNote: optionalString,
  sayThis: nonEmptyString("可直接说不能为空"),
});

export const createSupportCueInputSchema = z.object({
  practiceSession: createPracticeSessionInputSchema,
  cue: supportCueSchema,
  transcriptTurns: z.array(transcriptTurnInputSchema).default([]),
});

export const createSmartGuidanceInputSchema = z.object({
  practiceSession: createPracticeSessionInputSchema,
  transcriptTurns: z.array(transcriptTurnInputSchema).default([]),
});

export type SupportCue = z.infer<typeof supportCueSchema>;
export type SupportCueResult = z.infer<typeof supportCueResultSchema>;
export type SmartGuidance = z.infer<typeof smartGuidanceSchema>;
export type CreateSupportCueInput = z.infer<typeof createSupportCueInputSchema>;
export type CreateSmartGuidanceInput = z.infer<
  typeof createSmartGuidanceInputSchema
>;
