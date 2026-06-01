import {
  defaultScenarioPack,
  type PracticeGoal,
  type PracticeGoalId,
  type ScenarioPersona,
  type VoicePack,
  type VoicePackId,
} from "@/data/scenario-packs";
import type { MemoryItem } from "@/lib/validation/memory";
import type { ProgressSummary, WeaknessMetric } from "@/lib/progress/weakness-store";
import type { MaterialProcessingStatus } from "@/lib/materials/material-store";
import type { MaterialMemoryStatus } from "@/lib/validation/materials";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

type MaterialContext = {
  id: string;
  name: string;
  processingStatus: MaterialProcessingStatus;
  memoryStatus: MaterialMemoryStatus;
  confidentialMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TodayRecommendationMaterialMode =
  | "recent_material"
  | "no_material"
  | "memory_context"
  | "specific_material";

export type TodayRecommendation = {
  id: string;
  title: string;
  reason: string;
  goalId: PracticeGoalId;
  goalLabel: string;
  personaId: string;
  personaLabel: string;
  voicePackId: VoicePackId;
  voicePackLabel: string;
  materialMode: TodayRecommendationMaterialMode;
  materialId?: string;
  materialLabel: string;
  durationMinutes: number;
  href: string;
  source: "ai" | "fallback";
  evidence: string[];
};

export type PracticeRecommendationLinkParams = Pick<
  TodayRecommendation,
  "goalId" | "personaId" | "voicePackId" | "materialMode" | "materialId"
> & {
  id?: string;
};

export type GenerateTodayRecommendationInput = {
  analytics?: ReviewAnalyticsSnapshot | null;
  excludedRecommendationIds?: string[];
  progress: ProgressSummary;
  recentMaterials: MaterialContext[];
  memories: MemoryItem[];
  mockMode?: boolean;
  random?: () => number;
};

export const TODAY_RECOMMENDATION_POOL_SIZE = 30;
export const TODAY_RECOMMENDATION_POOL_SIGNATURE = "random-config-v2-size-30";
const materialFriendlyGoalIds = new Set<PracticeGoalId>([
  "application_scenarios",
  "demo_narration",
  "product_parameters",
]);

type RecommendationPayload = {
  title?: string;
  reason: string;
  goalId: string;
  personaId: string;
  voicePackId: string;
  materialMode: TodayRecommendationMaterialMode;
  materialId?: string;
  materialLabel?: string;
  durationMinutes: number;
  evidence: string[];
};

type RecommendationCandidate = {
  goal: PracticeGoal;
  materialId?: string;
  materialLabel: string;
  materialMode: TodayRecommendationMaterialMode;
  persona: ScenarioPersona;
  voicePack: VoicePack;
};

const weaknessGoalMap: Partial<Record<WeaknessMetric["type"], PracticeGoalId>> = {
  feature_only_talk: "application_scenarios",
  grammar_accuracy: "customer_qa",
  fluency: "quick_pitch",
  long_answers: "quick_pitch",
  missing_next_step: "solution_meeting",
  pronunciation_clarity: "customer_qa",
  repetitive_vocabulary: "demo_narration",
  unclear_positioning: "competitive_differences",
  weak_discovery: "customer_qa",
  weak_objection_handling: "privacy_security",
};

function clampDuration(durationMinutes: number) {
  return Math.min(Math.max(Math.round(durationMinutes), 6), 15);
}

function findGoal(goalId: string) {
  return (
    defaultScenarioPack.practiceGoals.find((goal) => goal.id === goalId) ??
    defaultScenarioPack.practiceGoals[0]
  );
}

function findPersona(personaId: string, fallbackPersonaIds: string[]) {
  return (
    defaultScenarioPack.personas.find((persona) => persona.id === personaId) ??
    defaultScenarioPack.personas.find((persona) =>
      fallbackPersonaIds.includes(persona.id),
    ) ??
    defaultScenarioPack.personas[0]
  );
}

function findVoicePack(voicePackId: string, fallbackVoicePackIds: VoicePackId[]) {
  return (
    defaultScenarioPack.voicePacks.find((voicePack) => voicePack.id === voicePackId) ??
    defaultScenarioPack.voicePacks.find((voicePack) =>
      fallbackVoicePackIds.includes(voicePack.id),
    ) ??
    defaultScenarioPack.voicePacks[0]
  );
}

function normalizeRecommendation(
  payload: RecommendationPayload,
  source: TodayRecommendation["source"],
): TodayRecommendation {
  const goal = findGoal(payload.goalId);
  const persona = findPersona(payload.personaId, goal.recommendedPersonaIds);
  const voicePack = findVoicePack(payload.voicePackId, goal.recommendedVoicePackIds);
  const materialLabel =
    payload.materialLabel ??
    (payload.materialMode === "no_material" ? "不使用材料" : "系统记忆");

  const recommendation = {
    id: buildRecommendationId({
      goalId: goal.id,
      personaId: persona.id,
      voicePackId: voicePack.id,
      materialMode: payload.materialMode,
      materialId: payload.materialId,
    }),
    title: payload.title ?? `${persona.label} · ${goal.label}`,
    reason: payload.reason,
    goalId: goal.id,
    goalLabel: goal.label,
    personaId: persona.id,
    personaLabel: persona.label,
    voicePackId: voicePack.id,
    voicePackLabel: voicePack.name,
    materialMode: payload.materialMode,
    materialId: payload.materialId,
    materialLabel,
    durationMinutes: clampDuration(payload.durationMinutes),
    href: "/practice",
    source,
    evidence: payload.evidence,
  };

  return {
    ...recommendation,
    href: buildPracticeHrefFromRecommendation(recommendation),
  };
}

export function buildPracticeHrefFromRecommendation(
  recommendation: PracticeRecommendationLinkParams,
) {
  const recommendationId =
    "id" in recommendation && typeof recommendation.id === "string"
      ? recommendation.id
      : buildRecommendationId(recommendation);
  const params = new URLSearchParams({
    source: "today-recommendation",
    recommendationId,
    goalId: recommendation.goalId,
    personaId: recommendation.personaId,
    voicePackId: recommendation.voicePackId,
    materialMode: recommendation.materialMode,
  });

  if (recommendation.materialId) {
    params.set("materialId", recommendation.materialId);
  }

  return `/practice?${params.toString()}`;
}

export function buildRecommendationId(
  recommendation: PracticeRecommendationLinkParams,
) {
  return [
    recommendation.goalId,
    recommendation.personaId,
    recommendation.voicePackId,
    recommendation.materialMode,
    recommendation.materialId,
  ]
    .filter((value): value is string => Boolean(value))
    .join(":");
}

function buildRecommendationPackageKey(
  recommendation: Pick<
    PracticeRecommendationLinkParams,
    "goalId" | "personaId" | "voicePackId"
  >,
) {
  return [
    recommendation.goalId,
    recommendation.personaId,
    recommendation.voicePackId,
  ].join(":");
}

function buildRecommendationPackageKeyFromId(recommendationId: string) {
  return recommendationId.split(":").slice(0, 3).join(":");
}

function isExcludedRecommendation(
  recommendation: TodayRecommendation,
  excludedRecommendationIds: string[] | undefined,
) {
  if (!excludedRecommendationIds?.length) {
    return false;
  }

  const excludedPackageKeys = new Set(
    excludedRecommendationIds.map(buildRecommendationPackageKeyFromId),
  );

  return (
    excludedRecommendationIds.includes(recommendation.id) ||
    excludedPackageKeys.has(buildRecommendationPackageKey(recommendation))
  );
}

function getReadyMaterial(input: GenerateTodayRecommendationInput) {
  return input.recentMaterials.find(
    (material) =>
      material.processingStatus === "ready" &&
      material.memoryStatus !== "confidential",
  );
}

function selectMaterialContext(
  input: GenerateTodayRecommendationInput,
  goal: PracticeGoal,
): Pick<
  RecommendationCandidate,
  "materialId" | "materialLabel" | "materialMode"
> {
  const readyMaterial = getReadyMaterial(input);

  if (readyMaterial && materialFriendlyGoalIds.has(goal.id)) {
    return {
      materialId: readyMaterial.id,
      materialLabel: readyMaterial.name,
      materialMode: "recent_material",
    };
  }

  if (
    input.memories.length > 0 ||
    input.analytics ||
    input.progress.topWeaknesses.length > 0
  ) {
    return {
      materialLabel: "系统记忆",
      materialMode: "memory_context",
    };
  }

  return {
    materialLabel: "不使用材料",
    materialMode: "no_material",
  };
}

function buildFallbackRecommendationForGoal(
  input: GenerateTodayRecommendationInput,
  preferredGoalId?: PracticeGoalId,
) {
  const topWeakness = input.progress.topWeaknesses[0];
  const goalId =
    preferredGoalId ?? (topWeakness ? weaknessGoalMap[topWeakness.type] : undefined);
  const goal = findGoal(goalId ?? "application_scenarios");
  const persona = findPersona(goal.recommendedPersonaIds[0], goal.recommendedPersonaIds);
  const voicePack = findVoicePack(
    goal.recommendedVoicePackIds[0],
    goal.recommendedVoicePackIds,
  );
  const materialContext = selectMaterialContext(input, goal);
  const recentMaterial = getReadyMaterial(input);
  const memory = input.memories[0];
  const evidence = [
    topWeakness?.evidence,
    memory ? `${memory.title}: ${memory.summary}` : undefined,
    recentMaterial?.name,
  ].filter((item): item is string => Boolean(item));
  const reasonEvidence = topWeakness
    ? `你最近的复盘显示「${topWeakness.label}」仍然值得加强`
    : memory
      ? `系统记忆显示你适合练习更商务、更贴近客户场景的表达`
      : "当前还没有足够复盘数据，先从 Rokid 常见客户沟通场景开始";

  return normalizeRecommendation(
    {
      title: `${persona.label} · ${goal.label}`,
      reason: `推荐原因：${reasonEvidence}，今天建议用更聚焦的 ${goal.label} 训练来沉淀可直接复用的商务表达。`,
      goalId: goal.id,
      personaId: persona.id,
      voicePackId: voicePack.id,
      materialMode: materialContext.materialMode,
      materialId: materialContext.materialId,
      materialLabel: materialContext.materialLabel,
      durationMinutes: 8,
      evidence,
    },
    "fallback",
  );
}

function buildFallbackRecommendation(input: GenerateTodayRecommendationInput) {
  const topWeakness = input.progress.topWeaknesses[0];
  const preferredGoalId = topWeakness ? weaknessGoalMap[topWeakness.type] : undefined;
  const preferredRecommendation = buildFallbackRecommendationForGoal(
    input,
    preferredGoalId,
  );

  if (!isExcludedRecommendation(preferredRecommendation, input.excludedRecommendationIds)) {
    return preferredRecommendation;
  }

  return (
    defaultScenarioPack.practiceGoals
      .map((goal) => buildFallbackRecommendationForGoal(input, goal.id))
      .find(
        (recommendation) =>
          !isExcludedRecommendation(recommendation, input.excludedRecommendationIds),
      ) ?? preferredRecommendation
  );
}

function matchingFocusCount(goal: PracticeGoal, focusTags: string[]) {
  const normalizedFocusTags = new Set(
    focusTags.map((tag) => tag.trim()).filter(Boolean),
  );

  return goal.defaultFocusTags.filter((tag) => normalizedFocusTags.has(tag)).length;
}

function buildPresetRecommendationReason(
  input: GenerateTodayRecommendationInput,
  goal: PracticeGoal,
) {
  const topWeakness = input.progress.topWeaknesses[0];
  const analyticsPlan = input.analytics?.nextTrainingPlan;
  const readyMaterial = getReadyMaterial(input);

  if (topWeakness && weaknessGoalMap[topWeakness.type] === goal.id) {
    return `推荐原因：你最近的复盘显示「${topWeakness.label}」需要优先加强，今天先用「${goal.label}」把这个弱点练成可直接复用的商务表达。`;
  }

  if (
    analyticsPlan &&
    matchingFocusCount(goal, analyticsPlan.focusTags) > 0
  ) {
    return `推荐原因：长期复盘建议继续加强「${analyticsPlan.title}」，这个预设包会用「${goal.label}」把下一步训练落到具体会谈里。`;
  }

  if (
    readyMaterial &&
    materialFriendlyGoalIds.has(goal.id)
  ) {
    return `推荐原因：最近材料「${readyMaterial.name}」适合沉淀成客户可理解的表达，今天用「${goal.label}」练习把材料讲清楚。`;
  }

  if (input.memories.length > 0) {
    return `推荐原因：系统记忆显示你适合持续沉淀商务会谈表达，今天用「${goal.label}」补齐一个常见客户沟通场景。`;
  }

  return `推荐原因：今天先用「${goal.label}」覆盖 Rokid 海外商务会谈中的一个高频场景，保持练习节奏并积累复盘数据。`;
}

function shuffleCandidates(
  candidates: RecommendationCandidate[],
  random: () => number,
) {
  const result = [...candidates];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function buildRecommendationCandidates(input: GenerateTodayRecommendationInput) {
  return defaultScenarioPack.practiceGoals.flatMap((goal) => {
    const materialContext = selectMaterialContext(input, goal);

    return goal.recommendedPersonaIds.flatMap((personaId) => {
      const persona = findPersona(personaId, goal.recommendedPersonaIds);

      return goal.recommendedVoicePackIds.map((voicePackId) => ({
        ...materialContext,
        goal,
        persona,
        voicePack: findVoicePack(voicePackId, goal.recommendedVoicePackIds),
      }));
    });
  });
}

function buildRecommendationFromCandidate(
  input: GenerateTodayRecommendationInput,
  candidate: RecommendationCandidate,
) {
  const topWeakness = input.progress.topWeaknesses[0];
  const analyticsPlan = input.analytics?.nextTrainingPlan;
  const readyMaterial = getReadyMaterial(input);
  const memory = input.memories[0];
  const evidence = [
    TODAY_RECOMMENDATION_POOL_SIGNATURE,
    topWeakness?.evidence,
    analyticsPlan?.reasonZh,
    memory ? `${memory.title}: ${memory.summary}` : undefined,
    readyMaterial?.name,
    ...candidate.goal.defaultFocusTags,
  ].filter((item): item is string => Boolean(item));

  return normalizeRecommendation(
    {
      title: `${candidate.persona.label} · ${candidate.goal.label}`,
      reason: buildPresetRecommendationReason(input, candidate.goal),
      goalId: candidate.goal.id,
      personaId: candidate.persona.id,
      voicePackId: candidate.voicePack.id,
      materialMode: candidate.materialMode,
      materialId: candidate.materialId,
      materialLabel: candidate.materialLabel,
      durationMinutes: 8,
      evidence: Array.from(new Set(evidence)).slice(0, 8),
    },
    "fallback",
  );
}

export function buildPresetTodayRecommendationPool(
  input: GenerateTodayRecommendationInput,
) {
  const candidates = buildRecommendationCandidates(input);
  const random = input.random ?? Math.random;
  const pool: TodayRecommendation[] = [];
  const selectedPackageKeys = new Set<string>();

  for (const candidate of shuffleCandidates(candidates, random)) {
    const recommendation = buildRecommendationFromCandidate(input, candidate);
    const packageKey = buildRecommendationPackageKey(recommendation);

    if (
      selectedPackageKeys.has(packageKey) ||
      isExcludedRecommendation(recommendation, input.excludedRecommendationIds)
    ) {
      continue;
    }

    selectedPackageKeys.add(packageKey);
    pool.push(recommendation);

    if (pool.length >= TODAY_RECOMMENDATION_POOL_SIZE) {
      break;
    }
  }

  return pool.length > 0 ? pool : [buildFallbackRecommendation(input)];
}

export async function generateTodayRecommendation(
  input: GenerateTodayRecommendationInput,
): Promise<TodayRecommendation> {
  return buildPresetTodayRecommendationPool(input)[0] ?? buildFallbackRecommendation(input);
}

export function getTodayRecommendation() {
  return buildPresetTodayRecommendationPool({
    progress: {
      recentTrainingCount: 0,
      topWeaknesses: [],
      improvedWeaknesses: [],
      recommendedDrills: [],
      history: [],
    },
    recentMaterials: [],
    memories: [],
  })[0];
}
