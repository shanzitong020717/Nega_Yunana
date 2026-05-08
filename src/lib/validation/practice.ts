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
    error: "Invalid practice mode",
  },
);

export const difficultySchema = z.enum(
  ["easy", "normal", "hard", "executive"],
  {
    error: "Invalid difficulty",
  },
);

export const personaIdSchema = z.enum(personaIds, {
  error: "Invalid customer persona",
});

export const createPrepCardInputSchema = z.object({
  materialId: optionalString,
  customerType: nonEmptyString("Customer type is required"),
  industry: optionalString,
  countryOrRegion: optionalString,
  meetingGoal: nonEmptyString("Meeting goal is required"),
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
    error: "Invalid transcript speaker",
  }),
  text: nonEmptyString("Transcript text is required"),
  timestamp: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const saveTranscriptInputSchema = z.object({
  turns: z.array(transcriptTurnInputSchema).min(1, "At least one turn is required"),
});

export type CreatePrepCardInput = z.infer<typeof createPrepCardInputSchema>;
export type CreatePracticeSessionInput = z.infer<typeof createPracticeSessionInputSchema>;
export type TranscriptTurnInput = z.infer<typeof transcriptTurnInputSchema>;
export type SaveTranscriptInput = z.infer<typeof saveTranscriptInputSchema>;
