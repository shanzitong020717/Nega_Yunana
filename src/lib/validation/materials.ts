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
  name: nonEmptyString("Material name is required"),
  fileType: z.enum(supportedFileTypes, {
    error: "Unsupported file type",
  }),
  originalFileName: nonEmptyString("Original file name is required"),
  storagePath: nonEmptyString("Storage path is required"),
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
