import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { generateMaterialBrief } from "@/lib/ai/material-brief";
import { apiErrorResponse, handleApiError } from "@/lib/errors";
import {
  getMaterialBriefRecord,
  getMaterialRecord,
  saveMaterialBriefRecord,
} from "@/lib/materials/material-store";

type MaterialBriefRouteContext = {
  params:
    | Promise<{
        materialId: string;
      }>
    | {
        materialId: string;
      };
};

function briefResponse(materialId: string, brief: unknown) {
  return NextResponse.json({
    materialId,
    status: "ready",
    brief,
  });
}

export async function GET(
  _request: Request,
  context: MaterialBriefRouteContext,
) {
  try {
    const authContext = await requireAuthContext();
    const { materialId } = await context.params;
    const material = getMaterialRecord(materialId, {
      userId: authContext.profileId,
    });

    if (!material) {
      return apiErrorResponse("NOT_FOUND", "未找到材料", 404);
    }

    const existingBrief = getMaterialBriefRecord(materialId);

    if (existingBrief) {
      return briefResponse(materialId, existingBrief);
    }

    if (!material.extractedText) {
      return apiErrorResponse(
        "PROCESSING_NOT_SUPPORTED",
        "当前材料文本暂不可用于生成简报",
        409,
      );
    }

    const brief = await generateMaterialBrief({
      materialName: material.name,
      customerType: material.customerType,
      industry: material.industry,
      meetingGoal: material.meetingGoal,
      notes: material.notes,
      extractedText: material.extractedText,
    });
    const savedBrief = saveMaterialBriefRecord(materialId, brief);

    return briefResponse(materialId, savedBrief);
  } catch (error) {
    return handleApiError(error);
  }
}
