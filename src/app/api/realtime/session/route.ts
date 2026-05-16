import { NextResponse } from "next/server";
import { z } from "zod";

import { personas } from "@/data/personas";
import {
  defaultScenarioPack,
  scenarioPacks,
  type ScenarioPack,
} from "@/data/scenario-packs";
import { createRealtimeSession, type RealtimePersona } from "@/lib/ai/realtime";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import {
  goalIdSchema,
  personaIdSchema,
  practiceModeSchema,
  scenarioPackIdSchema,
  voicePackIdSchema,
} from "@/lib/validation/practice";
import {
  nonEmptyString,
  optionalString,
  stringArraySchema,
} from "@/lib/validation/shared";

const createRealtimeSessionInputSchema = z.object({
  scenarioPackId: scenarioPackIdSchema.default(defaultScenarioPack.id),
  goalId: goalIdSchema.default("customer_qa"),
  practiceSessionId: nonEmptyString("练习会话不能为空"),
  personaId: personaIdSchema,
  voicePackId: voicePackIdSchema.default("ethan-technical-lead"),
  materialId: optionalString,
  prepCardId: optionalString,
  mode: practiceModeSchema,
  trainingFocus: stringArraySchema,
  focusTags: stringArraySchema.default([]),
  memorySnippets: stringArraySchema.default([]),
});

function resolveRealtimePersona(
  personaId: string,
  scenarioPack: ScenarioPack,
): RealtimePersona | null {
  const legacyPersona = personas.find((item) => item.id === personaId);

  if (legacyPersona) {
    return legacyPersona;
  }

  const scenarioPersona = scenarioPack.personas.find(
    (item) => item.id === personaId,
  );

  if (!scenarioPersona) {
    return null;
  }

  return {
    id: scenarioPersona.id,
    name: scenarioPersona.label,
    focusAreas: scenarioPersona.focusAreas,
    tone: scenarioPersona.communicationStyle,
    sampleQuestions: scenarioPersona.likelyFollowUps,
  };
}

export async function POST(request: Request) {
  try {
    const input = createRealtimeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const scenarioPack =
      scenarioPacks.find((item) => item.id === input.scenarioPackId) ??
      defaultScenarioPack;
    const persona = resolveRealtimePersona(input.personaId, scenarioPack);
    const practiceGoal =
      scenarioPack.practiceGoals.find((item) => item.id === input.goalId) ??
      scenarioPack.practiceGoals[0] ??
      null;
    const voicePack =
      scenarioPack.voicePacks.find((item) => item.id === input.voicePackId) ??
      scenarioPack.voicePacks[0] ??
      null;

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
      scenarioPack,
      practiceGoal,
      persona,
      voicePack,
      materialBrief,
      prepCard,
      mode: input.mode,
      trainingFocus: input.trainingFocus,
      focusTags: input.focusTags,
      memorySnippets: input.memorySnippets,
    });

    return NextResponse.json(realtimeSession, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
