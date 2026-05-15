import { z } from "zod";

import { personas } from "@/data/personas";
import { defaultScenarioPack } from "@/data/scenario-packs";
import { nonEmptyString, optionalString, stringArraySchema } from "./shared";

const personaIds = Array.from(
  new Set([
    ...personas.map((persona) => persona.id),
    ...defaultScenarioPack.personas.map((persona) => persona.id),
  ]),
) as [string, ...string[]];

export const practiceModeSchema = z.enum(
  [
    "presentation_rehearsal",
    "customer_qa",
    "objection_challenge",
    "solution_meeting",
    "demo_narration",
    "objection_handling",
    "quick_pitch",
  ],
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

export const goalIdSchema = z
  .string()
  .trim()
  .min(1, "练习目标不能为空")
  .default("customer_qa");

export const voicePackIdSchema = z
  .string()
  .trim()
  .min(1, "声音包不能为空")
  .default(defaultScenarioPack.voicePacks[0]?.id ?? "ava-friendly-buyer");

export const scenarioPackIdSchema = z
  .string()
  .trim()
  .min(1, "场景包不能为空")
  .default(defaultScenarioPack.id);

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
  scenarioPackId: scenarioPackIdSchema,
  goalId: goalIdSchema,
  mode: practiceModeSchema.default("customer_qa"),
  personaId: personaIdSchema,
  voicePackId: voicePackIdSchema,
  materialId: optionalString,
  prepCardId: optionalString,
  difficulty: difficultySchema.default("normal"),
  trainingFocus: stringArraySchema,
  focusTags: stringArraySchema.default([]),
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
