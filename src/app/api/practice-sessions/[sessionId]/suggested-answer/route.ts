import { NextResponse } from "next/server";

import { defaultScenarioPack } from "@/data/scenario-packs";
import { requireAuthContext } from "@/lib/auth/require-user";
import { generateSuggestedAnswer } from "@/lib/ai/suggested-answer";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import { savePhraseRecord } from "@/lib/phrasebook/phrasebook-store";
import {
  ensurePracticeSessionRecord,
  saveSuggestedAnswerRecord,
} from "@/lib/practice/practice-session-store";
import { getPrepCardRecord } from "@/lib/practice/prep-card-store";
import { createSuggestedAnswerInputSchema } from "@/lib/validation/suggested-answer";

type SuggestedAnswerRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(
  request: Request,
  context: SuggestedAnswerRouteContext,
) {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const { sessionId } = await context.params;
    const input = createSuggestedAnswerInputSchema.parse(
      await readJsonBody(request),
    );
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
    const suggestion = await generateSuggestedAnswer({
      latestAiTurn: input.latestAiTurn,
      transcriptTurns: input.transcriptTurns,
      persona,
      practiceSession,
      materialBrief,
      prepCard,
    });
    const phrasebookResult = savePhraseRecord(suggestion.phrasebookEntry, scope);

    saveSuggestedAnswerRecord(sessionId, suggestion, scope);

    return NextResponse.json(
      {
        sessionId,
        suggestion,
        phrasebook: phrasebookResult,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
