import { NextResponse } from "next/server";

import { apiErrorResponse, handleApiError } from "@/lib/errors";
import { deleteStoredFile } from "@/lib/file-processing/storage";
import {
  deleteMaterialRecord,
  getMaterialRecord,
} from "@/lib/materials/material-store";
import { deletePrepCardsByMaterialId } from "@/lib/practice/prep-card-store";
import { deletePracticeSessionsByMaterialId } from "@/lib/practice/practice-session-store";

type MaterialRouteContext = {
  params: Promise<{
    materialId: string;
  }>;
};

export async function DELETE(_request: Request, context: MaterialRouteContext) {
  try {
    const { materialId } = await context.params;
    const material = getMaterialRecord(materialId);

    if (!material) {
      return apiErrorResponse("NOT_FOUND", "Material not found", 404);
    }

    await deleteStoredFile(material.storagePath);
    deleteMaterialRecord(materialId);
    const deletedPrepCards = deletePrepCardsByMaterialId(materialId);
    const deletedPracticeSessions = deletePracticeSessionsByMaterialId(materialId);

    return NextResponse.json({
      materialId,
      deleted: true,
      deletedFile: true,
      deletedPrepCards,
      deletedPracticeSessions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
