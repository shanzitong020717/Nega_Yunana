import { z } from "zod";

import { personas } from "@/data/personas";
import { nonEmptyString, optionalString, stringArraySchema } from "./shared";

const personaIds = personas.map((persona) => persona.id) as [
  string,
  ...string[],
];

export const practiceModeSchema = z.enum(
  ["presentation_rehearsal", "customer_qa", "objection_challenge", "solution_meeting"],
  {
    error: "练习模式无效",
  },
);

export const difficultySchema = z.enum(
  ["easy", "normal", "hard", "executive"],
  {
    error: "难度无效",
  },
);

export const personaIdSchema = z.enum(personaIds, {
  error: "客户角色无效",
});

export const createPrepCardInputSchema = z.object({
  materialId: optionalString,
  customerType: nonEmptyString("请填写客户类型"),
  industry: optionalString,
  countryOrRegion: optionalString,
  meetingGoal: nonEmptyString("请填写会议目标"),
  knownConcerns: stringArraySchema,
  trainingFocus: stringArraySchema,
});

export const createPracticeSessionInputSchema = z.object({
  mode: practiceModeSchema,
  personaId: personaIdSchema,
  materialId: optionalString,
  prepCardId: optionalString,
  difficulty: difficultySchema.default("normal"),
  trainingFocus: stringArraySchema,
  sourceObjectionId: optionalString,
});

export const transcriptTurnInputSchema = z.object({
  speaker: z.enum(["user", "ai_customer", "system"], {
    error: "转写说话人无效",
  }),
  text: nonEmptyString("转写文本不能为空"),
  timestamp: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const saveTranscriptInputSchema = z.object({
  turns: z.array(transcriptTurnInputSchema).min(1, "至少需要一条对话记录"),
});

export type CreatePrepCardInput = z.infer<typeof createPrepCardInputSchema>;
export type CreatePracticeSessionInput = z.infer<typeof createPracticeSessionInputSchema>;
export type TranscriptTurnInput = z.infer<typeof transcriptTurnInputSchema>;
export type SaveTranscriptInput = z.infer<typeof saveTranscriptInputSchema>;
