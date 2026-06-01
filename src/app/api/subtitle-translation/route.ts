import { NextResponse } from "next/server";
import { z } from "zod";

import { generateSubtitleTranslation } from "@/lib/ai/subtitle-translation";
import { handleApiError, readJsonBody } from "@/lib/errors";

export const runtime = "edge";
export const preferredRegion = ["hkg1", "sin1"];

const subtitleTranslationInputSchema = z.object({
  speaker: z.enum(["ai_customer", "user"], {
    error: "字幕说话人无效",
  }),
  text: z.string().trim().min(1, "字幕内容不能为空"),
});

export async function POST(request: Request) {
  try {
    const input = subtitleTranslationInputSchema.parse(
      await readJsonBody(request),
    );
    const translation = await generateSubtitleTranslation(input);

    return NextResponse.json(translation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
