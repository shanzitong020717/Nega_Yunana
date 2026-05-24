import { NextResponse } from "next/server";
import { z } from "zod";

import { personas } from "@/data/personas";
import {
  defaultScenarioPack,
  scenarioPacks,
  type ScenarioPack,
} from "@/data/scenario-packs";
import { createRealtimeSession, type RealtimePersona } from "@/lib/ai/realtime";
import { requireAuthContext } from "@/lib/auth/require-user";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import { getPracticeSessionRecord } from "@/lib/practice/practice-session-store";
import {
  personaIdSchema,
  practiceModeSchema,
} from "@/lib/validation/practice";
import type { ResolvedPracticeContext } from "@/lib/validation/practice";
import {
  nonEmptyString,
  optionalString,
  stringArraySchema,
} from "@/lib/validation/shared";

const createRealtimeSessionInputSchema = z.object({
  scenarioPackId: z.string().trim().min(1, "场景包不能为空").optional(),
  goalId: z.string().trim().min(1, "练习目标不能为空").optional(),
  practiceSessionId: nonEmptyString("练习会话不能为空"),
  personaId: personaIdSchema.optional(),
  voicePackId: z.string().trim().min(1, "AI Studio 音色不能为空").optional(),
  materialId: optionalString,
  prepCardId: optionalString,
  mode: practiceModeSchema.optional(),
  trainingFocus: stringArraySchema,
  focusTags: stringArraySchema.default([]),
  memorySnippets: stringArraySchema.default([]),
  resolvedContext: z.unknown().optional(),
});

function resolveRealtimePersona(
  personaId: string,
  scenarioPack: ScenarioPack,
): RealtimePersona | null {
  const scenarioPersona = scenarioPack.personas.find(
    (item) => item.id === personaId,
  );

  if (scenarioPersona) {
    return {
      id: scenarioPersona.id,
      name: scenarioPersona.label,
      focusAreas: scenarioPersona.focusAreas,
      tone: scenarioPersona.communicationStyle,
      sampleQuestions: scenarioPersona.likelyFollowUps,
      rolePrompt: scenarioPersona.rolePrompt,
    };
  }

  const legacyPersona = personas.find((item) => item.id === personaId);

  if (legacyPersona) {
    return legacyPersona;
  }

  return null;
}

const legacyVoicePackIds: Record<string, string> = {
  "ava-friendly-buyer": "zephyr-bright",
  "serena-enterprise-decision-maker": "kore-firm",
  "ethan-technical-lead": "charon-informative",
  "marcus-executive-customer": "fenrir-excitable",
  "vivian-critical-procurement": "leda-youthful",
  "noah-channel-partner": "puck-upbeat",
};

function resolveVoicePack(voicePackId: string, scenarioPack: ScenarioPack) {
  const normalizedVoicePackId = legacyVoicePackIds[voicePackId] ?? voicePackId;

  return (
    scenarioPack.voicePacks.find((item) => item.id === normalizedVoicePackId) ??
    scenarioPack.voicePacks[0] ??
    null
  );
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const input = createRealtimeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const practiceSession = getPracticeSessionRecord(
      input.practiceSessionId,
      scope,
    );
    const cachedResolvedContext =
      input.resolvedContext as ResolvedPracticeContext | undefined;
    const resolvedContext =
      practiceSession?.resolvedContext ?? cachedResolvedContext;
    const scenarioPackId =
      input.scenarioPackId ??
      practiceSession?.scenarioPackId ??
      defaultScenarioPack.id;
    const scenarioPack =
      scenarioPacks.find((item) => item.id === scenarioPackId) ??
      defaultScenarioPack;
    const personaId =
      input.personaId ??
      practiceSession?.personaId ??
      resolvedContext?.persona.id ??
      "technical_lead";
    const goalId =
      input.goalId ??
      practiceSession?.goalId ??
      resolvedContext?.goal.id ??
      "customer_qa";
    const voicePackId =
      input.voicePackId ??
      practiceSession?.voicePackId ??
      resolvedContext?.voicePack.id ??
      "kore-firm";
    const mode =
      input.mode ?? practiceSession?.mode ?? "customer_qa";
    const trainingFocus =
      input.trainingFocus.length > 0
        ? input.trainingFocus
        : (practiceSession?.trainingFocus ?? resolvedContext?.focus.tags ?? []);
    const focusTags =
      input.focusTags.length > 0
        ? input.focusTags
        : (practiceSession?.focusTags ?? resolvedContext?.focus.tags ?? []);
    const materialId =
      input.materialId ??
      practiceSession?.materialId ??
      resolvedContext?.material.materialId;
    const prepCardId =
      input.prepCardId ??
      practiceSession?.prepCardId ??
      resolvedContext?.material.prepCardId;
    const memorySnippets =
      input.memorySnippets.length > 0
        ? input.memorySnippets
        : (resolvedContext?.memorySnippets ?? []);
    const persona = resolveRealtimePersona(personaId, scenarioPack);
    const practiceGoal =
      scenarioPack.practiceGoals.find((item) => item.id === goalId) ??
      scenarioPack.practiceGoals[0] ??
      null;
    const voicePack = resolveVoicePack(voicePackId, scenarioPack);

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

    const materialBrief = materialId
      ? getMaterialBriefRecord(materialId)
      : null;
    const prepCard = prepCardId
      ? getPrepCardRecord(prepCardId, scope)
      : null;
    const realtimeSession = await createRealtimeSession({
      practiceSessionId: input.practiceSessionId,
      scenarioPack,
      practiceGoal,
      persona,
      voicePack,
      materialBrief,
      prepCard,
      mode,
      trainingFocus,
      focusTags,
      memorySnippets,
    });

    return NextResponse.json(realtimeSession, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
