import { NextResponse } from "next/server";

import { defaultScenarioPack } from "@/data/scenario-packs";
import { requireAuthContext } from "@/lib/auth/require-user";
import { generateSupportCue } from "@/lib/ai/support-cue";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import { ensurePracticeSessionRecord } from "@/lib/practice/practice-session-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import { createSupportCueInputSchema } from "@/lib/validation/support-cue";

type SupportCueRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(request: Request, context: SupportCueRouteContext) {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const { sessionId } = await context.params;
    const input = createSupportCueInputSchema.parse(await readJsonBody(request));
    const practiceSession = ensurePracticeSessionRecord(
      sessionId,
      { ...input.practiceSession, ...scope },
    );
    const persona =
      defaultScenarioPack.personas.find(
        (item) => item.id === practiceSession.personaId,
      ) ?? defaultScenarioPack.personas[0];
    const materialBrief = practiceSession.materialId
      ? getMaterialBriefRecord(practiceSession.materialId)
      : null;
    const prepCard = practiceSession.prepCardId
      ? getPrepCardRecord(practiceSession.prepCardId, scope)
      : null;
    const cueResult = await generateSupportCue({
      cue: input.cue,
      diagnostics: {
        sessionId,
        userId: authContext.profileId,
      },
      transcriptTurns: input.transcriptTurns,
      persona,
      practiceSession,
      materialBrief,
      prepCard,
    });

    return NextResponse.json(
      {
        sessionId,
        cueResult,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
