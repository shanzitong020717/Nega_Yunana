import { personas as legacyPersonas } from "@/data/personas";
import {
  defaultScenarioPack,
  scenarioPacks,
  type ScenarioPack,
  type ScenarioPersona,
  type VoicePack,
} from "@/data/scenario-packs";
import {
  getMaterialBriefRecord,
  getMaterialRecord,
  listMaterialRecords,
} from "@/lib/materials/material-store";
import { rankMemoriesForPractice } from "@/lib/memory/memory-store";
import {
  getPrepCardRecord,
  listPrepCardRecords,
} from "@/lib/practice/prep-card-store";
import { savePracticeSessionRecord } from "@/lib/practice/practice-session-store";
import type {
  CreatePracticeSessionInput,
  MaterialMode,
  ResolvedPracticeContext,
} from "@/lib/validation/practice";

const legacyVoicePackIds: Record<string, VoicePack["id"]> = {
  "ava-friendly-buyer": "zephyr-bright",
  "serena-enterprise-decision-maker": "kore-firm",
  "ethan-technical-lead": "charon-informative",
  "marcus-executive-customer": "fenrir-excitable",
  "vivian-critical-procurement": "leda-youthful",
  "noah-channel-partner": "puck-upbeat",
};

const focusInstructionMap: Record<string, string> = {
  商业价值:
    "Push the learner to connect product features to business value and customer workflow outcomes.",
  隐私安全:
    "Ask about privacy, data flow, security boundaries, and unsupported claims.",
  试点推进:
    "Guide the learner toward a concrete pilot scope, success metric, owner, and next step.",
  简短回答:
    "Require concise answers before allowing elaboration.",
  探索式提问:
    "Reward discovery questions that clarify use case, decision process, and constraints.",
  产品演示表达:
    "Ask the learner to explain features through a customer-facing demo story.",
  应用场景说明:
    "Ask for concrete application scenarios and who benefits from them.",
  优缺点对比:
    "Ask for balanced pros, cons, and fit boundaries.",
  竞品差异:
    "Ask for safe differentiation versus alternative products or workflows.",
  产品参数解释:
    "Ask for precise product parameters and limits without inventing unsupported facts.",
};

export class PracticeSessionCreationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "PracticeSessionCreationError";
  }
}

function resolveScenarioPack(scenarioPackId: string) {
  return (
    scenarioPacks.find((scenarioPack) => scenarioPack.id === scenarioPackId) ??
    defaultScenarioPack
  );
}

function resolveGoal(input: CreatePracticeSessionInput, scenarioPack: ScenarioPack) {
  const goal = scenarioPack.practiceGoals.find((item) => item.id === input.goalId);

  if (!goal) {
    throw new PracticeSessionCreationError("练习目标无效");
  }

  return goal;
}

function resolvePersona(
  personaId: string,
  scenarioPack: ScenarioPack,
): ScenarioPersona {
  const scenarioPersona = scenarioPack.personas.find(
    (persona) => persona.id === personaId,
  );

  if (scenarioPersona) {
    return scenarioPersona;
  }

  const legacyPersona = legacyPersonas.find((persona) => persona.id === personaId);

  if (!legacyPersona) {
    throw new PracticeSessionCreationError("客户角色无效");
  }

  return {
    id: legacyPersona.id,
    label: legacyPersona.name,
    englishName: legacyPersona.name,
    pressureLevel: legacyPersona.id === "skeptical_executive" ? "high" : "medium",
    focusAreas: legacyPersona.focusAreas,
    communicationStyle: legacyPersona.tone,
    likelyFollowUps: legacyPersona.sampleQuestions,
    openingQuestions: legacyPersona.sampleQuestions,
    followUpPatterns: [
      `Keep follow-up questions focused on ${legacyPersona.focusAreas.join(", ")}.`,
    ],
    challengeRules: [
      "Challenge vague answers and ask for specific business evidence.",
    ],
    defaultFocusTags: legacyPersona.focusAreas.slice(0, 3),
    rolePrompt: `Act as a realistic ${legacyPersona.name}. Tone: ${legacyPersona.tone} Focus on ${legacyPersona.focusAreas.join(", ")}.`,
  };
}

function resolveVoicePack(voicePackId: string, scenarioPack: ScenarioPack) {
  const normalizedVoicePackId = legacyVoicePackIds[voicePackId] ?? voicePackId;
  const voicePack = scenarioPack.voicePacks.find(
    (item) => item.id === normalizedVoicePackId,
  );

  if (!voicePack) {
    throw new PracticeSessionCreationError("AI Studio 音色无效");
  }

  return voicePack;
}

function normalizeMaterialMode(input: CreatePracticeSessionInput): MaterialMode {
  if (input.materialId === "recent_material") {
    return "recent_material";
  }

  if (input.materialId === "memory_context") {
    return "memory_context";
  }

  if (input.materialId === "no_material") {
    return "no_material";
  }

  if (input.materialId && input.materialMode === "no_material") {
    return "specific_material";
  }

  return input.materialMode;
}

function memorySnippetsForFocus(focusTags: string[]) {
  return rankMemoriesForPractice({ focusTags, limit: 5 }).map(
    (memory) => `${memory.title}: ${memory.summary}`,
  );
}

function resolveMaterialContext(
  input: CreatePracticeSessionInput,
  materialMode: MaterialMode,
  focusTags: string[],
): Pick<ResolvedPracticeContext, "material" | "memorySnippets"> & {
  materialId?: string;
  prepCardId?: string;
} {
  if (materialMode === "no_material") {
    return {
      material: {
        mode: materialMode,
        resolutionStatus: "not_requested",
      },
      memorySnippets: [],
    };
  }

  if (materialMode === "memory_context") {
    return {
      material: {
        mode: materialMode,
        resolutionStatus: "fallback_to_memory",
      },
      memorySnippets: memorySnippetsForFocus(focusTags),
    };
  }

  const material =
    materialMode === "recent_material"
      ? listMaterialRecords().find(
          (record) => record.processingStatus === "ready" || record.extractedText,
        )
      : input.materialId
        ? getMaterialRecord(input.materialId)
        : null;

  if (!material) {
    if (materialMode === "specific_material") {
      throw new PracticeSessionCreationError("客户材料不存在", 404);
    }

    return {
      material: {
        mode: materialMode,
        resolutionStatus: "fallback_to_memory",
      },
      memorySnippets: memorySnippetsForFocus(focusTags),
    };
  }

  const materialBrief = getMaterialBriefRecord(material.id);
  const prepCard =
    (input.prepCardId ? getPrepCardRecord(input.prepCardId) : null) ??
    listPrepCardRecords().find((record) => record.materialId === material.id) ??
    null;

  return {
    materialId: material.id,
    prepCardId: prepCard?.id,
    material: {
      mode: materialMode,
      materialId: material.id,
      prepCardId: prepCard?.id,
      materialName: material.name,
      materialBriefSummary: materialBrief?.keyMessage,
      prepCardSummary: prepCard?.meetingGoal,
      resolutionStatus: "resolved",
    },
    memorySnippets:
      material.memoryStatus === "saved_to_memory" ||
      material.memoryStatus === "available_for_future"
        ? memorySnippetsForFocus(focusTags)
        : [],
  };
}

function resolveFocusContext(
  input: CreatePracticeSessionInput,
  persona: ScenarioPersona,
) {
  const tags =
    input.focusTags.length > 0
      ? input.focusTags
      : [...persona.defaultFocusTags, ...input.trainingFocus].filter(Boolean);
  const uniqueTags = Array.from(new Set(tags));

  return {
    tags: uniqueTags,
    realtimeInstructions: uniqueTags.map(
      (tag) => focusInstructionMap[tag] ?? `Practice focus: ${tag}.`,
    ),
    reviewDimensions: uniqueTags.map((tag) => `Review whether the learner improved on ${tag}.`),
  };
}

export function createResolvedPracticeSession(input: CreatePracticeSessionInput) {
  const scenarioPack = resolveScenarioPack(input.scenarioPackId);
  const goal = resolveGoal(input, scenarioPack);
  const persona = resolvePersona(input.personaId, scenarioPack);
  const voicePack = resolveVoicePack(input.voicePackId, scenarioPack);
  const materialMode = normalizeMaterialMode(input);
  const focus = resolveFocusContext(input, persona);
  const materialContext = resolveMaterialContext(input, materialMode, focus.tags);
  const resolvedContext: ResolvedPracticeContext = {
    goal,
    persona: {
      id: persona.id,
      label: persona.label,
      englishName: persona.englishName,
      communicationStyle: persona.communicationStyle,
      focusAreas: persona.focusAreas,
      openingQuestions: persona.openingQuestions,
      followUpPatterns: persona.followUpPatterns,
      challengeRules: persona.challengeRules,
      defaultFocusTags: persona.defaultFocusTags,
      rolePrompt: persona.rolePrompt,
    },
    voicePack: {
      id: voicePack.id,
      name: voicePack.name,
      providerVoiceName: voicePack.providerVoiceName,
      gender: voicePack.gender,
      personality: voicePack.personality,
      voiceStyle: voicePack.voiceStyle,
      modelVoiceHint: voicePack.modelVoiceHint,
      geminiLiveConfig: voicePack.geminiLiveConfig,
    },
    material: materialContext.material,
    focus,
    memorySnippets: materialContext.memorySnippets,
  };

  return savePracticeSessionRecord({
    ...input,
    materialMode,
    materialId: materialContext.materialId,
    prepCardId: materialContext.prepCardId ?? input.prepCardId,
    focusTags: focus.tags,
    trainingFocus: input.trainingFocus.length > 0 ? input.trainingFocus : focus.tags,
    resolvedContext,
  });
}
