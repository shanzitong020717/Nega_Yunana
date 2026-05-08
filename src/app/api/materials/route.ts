import { NextResponse } from "next/server";

import {
  createMaterialInputSchema,
  getSupportedFileTypeFromName,
} from "@/lib/validation/materials";
import { apiErrorResponse, handleApiError } from "@/lib/errors";
import { extractTextFromStoredFile } from "@/lib/file-processing/extract-text";
import { storeUploadedFile } from "@/lib/file-processing/storage";
import {
  listMaterialRecords,
  saveMaterialRecord,
} from "@/lib/materials/material-store";

export function GET() {
  return NextResponse.json({
    materials: listMaterialRecords(),
  });
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function getConfidentialMode(formData: FormData) {
  const values = formData.getAll("confidentialMode");

  if (values.length === 0) {
    return true;
  }

  return values.some((value) => value === "true" || value === "on");
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    typeof value.name === "string" &&
    typeof value.size === "number"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadedFile(file) || file.size === 0) {
      return apiErrorResponse("VALIDATION_ERROR", "请上传材料文件", 400);
    }

    const fileType = getSupportedFileTypeFromName(file.name);

    if (!fileType) {
      return apiErrorResponse("VALIDATION_ERROR", "不支持该文件类型", 400);
    }

    const storedUpload = await storeUploadedFile(file);
    const input = createMaterialInputSchema.parse({
      name: getFormString(formData, "name"),
      fileType,
      originalFileName: storedUpload.originalFileName,
      storagePath: storedUpload.storagePath,
      customerType: getFormString(formData, "customerType"),
      industry: getFormString(formData, "industry"),
      meetingGoal: getFormString(formData, "meetingGoal"),
      confidentialMode: getConfidentialMode(formData),
      notes: getFormString(formData, "notes"),
    });
    const extraction = await extractTextFromStoredFile(input);
    const material = saveMaterialRecord({
      ...input,
      extractionStatus: extraction.status,
      extractedText: extraction.text ?? undefined,
      processingStatus:
        extraction.status === "extracted"
          ? "processing"
          : "processing_not_supported_yet",
    });

    return NextResponse.json(
      {
        materialId: material.id,
        status: material.processingStatus,
        material,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
