import { NextResponse } from "next/server";

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
    const { memoryId } = await context.params;
    const input = updateMemoryInputSchema.parse(await readJsonBody(request));
    const memory = updateMemory(memoryId, input);

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
  const { memoryId } = await context.params;
  const memory = deleteMemory(memoryId);

  if (!memory) {
    return apiErrorResponse("NOT_FOUND", "没有找到这条记忆", 404);
  }

  return NextResponse.json({
    deleted: true,
    memoryId,
  });
}
