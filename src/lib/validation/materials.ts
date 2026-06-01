import { z } from "zod";

import { nonEmptyString, optionalString } from "./shared";

export const supportedFileTypes = ["PDF", "PPTX", "DOCX", "TXT", "MARKDOWN"] as const;

const fileTypeByExtension: Record<string, (typeof supportedFileTypes)[number]> = {
  ".docx": "DOCX",
  ".md": "MARKDOWN",
  ".markdown": "MARKDOWN",
  ".pdf": "PDF",
  ".pptx": "PPTX",
  ".txt": "TXT",
};

export const createMaterialInputSchema = z.object({
  name: nonEmptyString("请填写材料名称"),
  fileType: z.enum(supportedFileTypes, {
    error: "不支持该文件类型",
  }),
  originalFileName: nonEmptyString("原始文件名不能为空"),
  storagePath: nonEmptyString("存储路径不能为空"),
  customerType: optionalString,
  industry: optionalString,
  meetingGoal: optionalString,
  confidentialMode: z.boolean().default(true),
  notes: optionalString,
});

const glossaryItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  chinese: z.string().optional(),
});

export const materialMemoryStatusSchema = z
  .enum([
    "session_only",
    "available_for_future",
    "saved_to_memory",
    "confidential",
  ])
  .default("session_only");

export const materialBriefSchema = z.object({
  keyMessage: z.string().min(1),
  productPoints: z.array(z.string().min(1)),
  customerValue: z.array(z.string().min(1)),
  likelyQuestions: z.array(z.string().min(1)),
  applicationScenarios: z.array(z.string().min(1)).default([]),
  pros: z.array(z.string().min(1)).default([]),
  cons: z.array(z.string().min(1)).default([]),
  competitorDifferences: z.array(z.string().min(1)).default([]),
  productParameters: z.array(z.string().min(1)).default([]),
  memoryStatus: materialMemoryStatusSchema,
  likelyObjections: z.array(z.string().min(1)),
  riskyClaims: z.array(z.string().min(1)),
  usefulPhrases: z.array(z.string().min(1)),
  glossary: z.array(glossaryItemSchema),
  outline: z.array(z.string().min(1)),
});

export type CreateMaterialInput = z.infer<typeof createMaterialInputSchema>;
export type MaterialMemoryStatus = z.infer<typeof materialMemoryStatusSchema>;
export type MaterialBriefPayload = z.infer<typeof materialBriefSchema>;

export function getSupportedFileTypeFromName(fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return fileTypeByExtension[extension] ?? null;
}
