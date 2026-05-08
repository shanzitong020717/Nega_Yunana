import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "PROCESSING_NOT_SUPPORTED"
  | "RETRYABLE_AI_OUTPUT"
  | "INTERNAL_ERROR";

export function apiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new SyntaxError("请求体必须是有效 JSON");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiErrorResponse(
      "VALIDATION_ERROR",
      error.issues[0]?.message ?? "Invalid request",
      400,
    );
  }

  if (error instanceof SyntaxError) {
    return apiErrorResponse("INVALID_JSON", error.message, 400);
  }

  return apiErrorResponse("INTERNAL_ERROR", "服务器出现异常", 500);
}
