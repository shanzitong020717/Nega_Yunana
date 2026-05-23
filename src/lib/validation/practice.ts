import { z } from "zod";

import { personas } from "@/data/personas";
import {
  defaultScenarioPack,
  type GeminiLiveAudioConfig,
} from "@/data/scenario-packs";
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
  .min(1, "AI Studio 音色不能为空")
  .default(defaultScenarioPack.voicePacks[0]?.id ?? "kore-firm");

export const scenarioPackIdSchema = z
  .string()
  .trim()
  .min(1, "场景包不能为空")
  .default(defaultScenarioPack.id);

export const materialModeSchema = z
  .enum(["recent_material", "no_material", "memory_context", "specific_material"], {
    error: "材料模式无效",
  })
  .default("no_material");

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
  materialMode: materialModeSchema,
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
export type MaterialMode = z.infer<typeof materialModeSchema>;
export type TranscriptTurnInput = z.infer<typeof transcriptTurnInputSchema>;
export type SaveTranscriptInput = z.infer<typeof saveTranscriptInputSchema>;

export type ResolvedPracticeContext = {
  goal: {
    id: string;
    label: string;
    description: string;
  };
  persona: {
    id: string;
    label: string;
    englishName?: string;
    communicationStyle: string;
    focusAreas: string[];
    openingQuestions: string[];
    followUpPatterns: string[];
    challengeRules: string[];
    defaultFocusTags: string[];
    rolePrompt: string;
  };
  voicePack: {
    id: string;
    name: string;
    providerVoiceName: string;
    gender: "female" | "male";
    personality: string;
    voiceStyle: string;
    modelVoiceHint: string;
    geminiLiveConfig: GeminiLiveAudioConfig;
  };
  material: {
    mode: MaterialMode;
    materialId?: string;
    prepCardId?: string;
    materialName?: string;
    materialBriefSummary?: string;
    prepCardSummary?: string;
    resolutionStatus:
      | "resolved"
      | "not_found"
      | "not_requested"
      | "fallback_to_memory";
  };
  focus: {
    tags: string[];
    realtimeInstructions: string[];
    reviewDimensions: string[];
  };
  memorySnippets: string[];
};
