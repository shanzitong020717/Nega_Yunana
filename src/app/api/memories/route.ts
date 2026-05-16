import { NextResponse } from "next/server";

import { apiErrorResponse, handleApiError, readJsonBody } from "@/lib/errors";
import { createMemory, listMemories } from "@/lib/memory/memory-store";
import {
  createMemoryInputSchema,
  memoryTypeSchema,
} from "@/lib/validation/memory";

export function GET(request?: Request) {
  const url = request ? new URL(request.url) : null;
  const rawType = url?.searchParams.get("type") ?? "all";
  const parsedType =
    rawType === "all" ? "all" : memoryTypeSchema.safeParse(rawType).data;

  if (!parsedType) {
    return apiErrorResponse("VALIDATION_ERROR", "记忆类型无效", 400);
  }

  return NextResponse.json({
    memories: listMemories({
      type: parsedType,
    }),
  });
}

export async function POST(request: Request) {
  try {
    const input = createMemoryInputSchema.parse(await readJsonBody(request));
    const memory = createMemory(input);

    return NextResponse.json(
      {
        memory,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
