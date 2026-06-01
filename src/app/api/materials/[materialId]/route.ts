import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
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
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const { materialId } = await context.params;
    const material = getMaterialRecord(materialId, scope);

    if (!material) {
      return apiErrorResponse("NOT_FOUND", "未找到材料", 404);
    }

    await deleteStoredFile(material.storagePath);
    deleteMaterialRecord(materialId, scope);
    const deletedPrepCards = deletePrepCardsByMaterialId(materialId, scope);
    const deletedPracticeSessions = deletePracticeSessionsByMaterialId(
      materialId,
      scope,
    );

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
