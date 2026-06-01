import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { apiErrorResponse, handleApiError, readJsonBody } from "@/lib/errors";
import { deleteMemory, updateMemory } from "@/lib/memory/memory-store";
import { updateMemoryInputSchema } from "@/lib/validation/memory";

type MemoryRouteContext = {
  params: Promise<{
    memoryId: string;
  }>;
};

export async function PATCH(request: Request, context: MemoryRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const { memoryId } = await context.params;
    const input = updateMemoryInputSchema.parse(await readJsonBody(request));
    const memory = updateMemory(memoryId, input, {
      userId: authContext.profileId,
    });

    if (!memory) {
      return apiErrorResponse("NOT_FOUND", "没有找到这条记忆", 404);
    }

    return NextResponse.json({
      memory,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: MemoryRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const { memoryId } = await context.params;
    const memory = deleteMemory(memoryId, {
      userId: authContext.profileId,
    });

    if (!memory) {
      return apiErrorResponse("NOT_FOUND", "没有找到这条记忆", 404);
    }

    return NextResponse.json({
      deleted: true,
      memoryId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
