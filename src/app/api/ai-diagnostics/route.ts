import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { handleApiError } from "@/lib/errors";
import {
  listAiCallDiagnosticsAsync,
  summarizeAiCallDiagnostics,
} from "@/lib/ai/diagnostics";

export async function GET(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const diagnostics = await listAiCallDiagnosticsAsync({
      limit,
      userId: authContext.profileId,
    });

    return NextResponse.json({
      diagnostics,
      summary: summarizeAiCallDiagnostics(diagnostics),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
