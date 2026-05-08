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

export type CreateMaterialInput = z.infer<typeof createMaterialInputSchema>;

export function getSupportedFileTypeFromName(fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return fileTypeByExtension[extension] ?? null;
}
