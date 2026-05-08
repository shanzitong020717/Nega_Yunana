import { z } from "zod";

import { phraseCategories } from "@/data/seed-phrases";
import { nonEmptyString, optionalString, stringArraySchema } from "./shared";

export const phraseCategorySchema = z.enum(phraseCategories, {
  error: "Invalid phrase category",
});

export const createPhraseInputSchema = z.object({
  category: phraseCategorySchema,
  english: nonEmptyString("English sentence is required"),
  chinese: nonEmptyString("Chinese meaning is required"),
  useCase: nonEmptyString("Use case is required"),
  simpleVersion: optionalString,
  professionalVersion: optionalString,
  relatedProductPoint: optionalString,
  relatedObjection: optionalString,
  tags: stringArraySchema,
  source: z
    .enum(["built_in", "material", "review", "user_added"], {
      error: "Invalid phrase source",
    })
    .default("user_added"),
  masteryStatus: z
    .enum(["new", "needs_practice", "practicing", "mastered"], {
      error: "Invalid mastery status",
    })
    .default("new"),
});

export type CreatePhraseInput = z.infer<typeof createPhraseInputSchema>;
