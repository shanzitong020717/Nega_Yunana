import { NextResponse } from "next/server";
import { z } from "zod";

import { personas } from "@/data/personas";
import { createRealtimeSession } from "@/lib/ai/realtime";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import {
  personaIdSchema,
  practiceModeSchema,
} from "@/lib/validation/practice";
import {
  nonEmptyString,
  optionalString,
  stringArraySchema,
} from "@/lib/validation/shared";

const createRealtimeSessionInputSchema = z.object({
  practiceSessionId: nonEmptyString("练习会话不能为空"),
  personaId: personaIdSchema,
  materialId: optionalString,
  prepCardId: optionalString,
  mode: practiceModeSchema,
  trainingFocus: stringArraySchema,
});

export async function POST(request: Request) {
  try {
    const input = createRealtimeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const persona = personas.find((item) => item.id === input.personaId);

    if (!persona) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "客户角色无效",
          },
        },
        { status: 400 },
      );
    }

    const materialBrief = input.materialId
      ? getMaterialBriefRecord(input.materialId)
      : null;
    const prepCard = input.prepCardId
      ? getPrepCardRecord(input.prepCardId)
      : null;
    const realtimeSession = await createRealtimeSession({
      practiceSessionId: input.practiceSessionId,
      persona,
      materialBrief,
      prepCard,
      mode: input.mode,
      trainingFocus: input.trainingFocus,
    });

    return NextResponse.json(realtimeSession, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
