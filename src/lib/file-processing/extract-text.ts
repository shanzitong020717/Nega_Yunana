import { readFile } from "node:fs/promises";

import type { CreateMaterialInput } from "@/lib/validation/materials";

export type TextExtractionInput = Pick<
  CreateMaterialInput,
  "fileType" | "originalFileName" | "storagePath"
>;

export type TextExtractionResult =
  | {
      status: "extracted";
      text: string;
    }
  | {
      status: "processing_not_supported_yet";
      text: null;
      message: string;
    };

export async function extractTextFromStoredFile(
  material: TextExtractionInput,
): Promise<TextExtractionResult> {
  if (material.fileType === "TXT" || material.fileType === "MARKDOWN") {
    return {
      status: "extracted",
      text: await readFile(material.storagePath, "utf8"),
    };
  }

  return {
    status: "processing_not_supported_yet",
    text: null,
    message: `Text extraction for ${material.fileType} is not supported yet.`,
  };
}
