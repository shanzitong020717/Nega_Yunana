import { z } from "zod";

import { nonEmptyString, optionalString } from "@/lib/validation/shared";

export const memoryTypes = [
  "profile",
  "speaking_habit",
  "weakness",
  "material_context",
  "customer_context",
  "phrase_preference",
  "learning_preference",
] as const;

export const memoryTypeSchema = z.enum(memoryTypes, {
  error: "记忆类型无效",
});

export const memorySourceSchema = z.enum(["review", "material", "manual", "system"], {
  error: "记忆来源无效",
});

const timestampSchema = z.string().datetime({ error: "时间格式无效" }).nullable();

export const memoryItemSchema = z.object({
  id: nonEmptyString("记忆 ID 不能为空"),
  scenarioPackId: nonEmptyString("场景包不能为空"),
  type: memoryTypeSchema,
  title: nonEmptyString("记忆标题不能为空"),
  summary: nonEmptyString("记忆摘要不能为空"),
  source: memorySourceSchema,
  sourceCreatedAt: timestampSchema,
  confidence: z.number().min(0).max(1),
  importance: z.number().int().min(1).max(5),
  lastUsedAt: timestampSchema,
  useCount: z.number().int().min(0),
  enabledForAi: z.boolean(),
  sensitive: z.boolean(),
  expiresAt: timestampSchema,
  createdAt: z.string().datetime({ error: "创建时间格式无效" }),
  updatedAt: z.string().datetime({ error: "更新时间格式无效" }),
});

export const createMemoryInputSchema = z.object({
  scenarioPackId: nonEmptyString("场景包不能为空").default("rokid-overseas-sales"),
  type: memoryTypeSchema,
  title: nonEmptyString("记忆标题不能为空"),
  summary: nonEmptyString("记忆摘要不能为空"),
  source: memorySourceSchema.default("manual"),
  sourceCreatedAt: z
    .string()
    .datetime({ error: "来源时间格式无效" })
    .optional()
    .nullable(),
  confidence: z.number().min(0).max(1).default(0.75),
  importance: z.number().int().min(1).max(5).default(3),
  enabledForAi: z.boolean().default(true),
  sensitive: z.boolean().default(false),
  expiresAt: optionalString.nullable().optional(),
});

export const updateMemoryInputSchema = z
  .object({
    type: memoryTypeSchema.optional(),
    title: nonEmptyString("记忆标题不能为空").optional(),
    summary: nonEmptyString("记忆摘要不能为空").optional(),
    source: memorySourceSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    importance: z.number().int().min(1).max(5).optional(),
    enabledForAi: z.boolean().optional(),
    sensitive: z.boolean().optional(),
    expiresAt: optionalString.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个更新字段",
  });

export type MemoryType = z.infer<typeof memoryTypeSchema>;
export type MemorySource = z.infer<typeof memorySourceSchema>;
export type MemoryItem = z.infer<typeof memoryItemSchema>;
export type CreateMemoryInput = z.infer<typeof createMemoryInputSchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemoryInputSchema>;
