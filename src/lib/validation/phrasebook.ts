import { z } from "zod";

import { phraseCategories } from "@/data/seed-phrases";
import { nonEmptyString, optionalString, stringArraySchema } from "./shared";

export const phraseCategorySchema = z.enum(phraseCategories, {
  error: "表达类别无效",
});

export const createPhraseInputSchema = z.object({
  category: phraseCategorySchema,
  english: nonEmptyString("英文句子不能为空"),
  chinese: nonEmptyString("中文含义不能为空"),
  useCase: nonEmptyString("使用场景不能为空"),
  simpleVersion: optionalString,
  professionalVersion: optionalString,
  relatedProductPoint: optionalString,
  relatedObjection: optionalString,
  tags: stringArraySchema,
  source: z
    .enum(["built_in", "material", "review", "user_added"], {
      error: "表达来源无效",
    })
    .default("user_added"),
  masteryStatus: z
    .enum(["new", "needs_practice", "reviewing", "mastered"], {
      error: "掌握状态无效",
    })
    .default("needs_practice"),
});

export type CreatePhraseInput = z.infer<typeof createPhraseInputSchema>;
