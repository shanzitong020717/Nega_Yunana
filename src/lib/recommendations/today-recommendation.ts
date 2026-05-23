import { z } from "zod";

import {
  defaultScenarioPack,
  type PracticeGoalId,
  type VoicePackId,
} from "@/data/scenario-packs";
import {
  generateTextJSON,
  hasTextAIApiKey,
  TEXT_ANALYSIS_BOUNDARY,
} from "@/lib/ai/text-client";
import type { MemoryItem } from "@/lib/validation/memory";
import type { ProgressSummary, WeaknessMetric } from "@/lib/progress/weakness-store";
import type { MaterialProcessingStatus } from "@/lib/materials/material-store";
import type { MaterialMemoryStatus } from "@/lib/validation/materials";

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
>;

type GenerateTodayRecommendationInput = {
  progress: ProgressSummary;
  recentMaterials: MaterialContext[];
  memories: MemoryItem[];
  mockMode?: boolean;
};

const recommendationPayloadSchema = z.object({
  title: z.string().min(1).optional(),
  reason: z.string().min(1),
  goalId: z.string().min(1),
  personaId: z.string().min(1),
  voicePackId: z.string().min(1),
  materialMode: z
    .enum(["recent_material", "no_material", "memory_context", "specific_material"])
    .default("memory_context"),
  materialId: z.string().min(1).optional(),
  materialLabel: z.string().min(1).optional(),
  durationMinutes: z.number().int().min(5).max(20).default(10),
  evidence: z.array(z.string().min(1)).default([]),
});

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

function shouldUseMockMode(mockMode?: boolean) {
  return mockMode === true || process.env.AI_MOCK_MODE === "true" || !hasTextAIApiKey();
}

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
  payload: z.infer<typeof recommendationPayloadSchema>,
  source: TodayRecommendation["source"],
): TodayRecommendation {
  const goal = findGoal(payload.goalId);
  const persona = findPersona(payload.personaId, goal.recommendedPersonaIds);
  const voicePack = findVoicePack(payload.voicePackId, goal.recommendedVoicePackIds);
  const materialLabel =
    payload.materialLabel ??
    (payload.materialMode === "no_material" ? "不使用材料" : "系统记忆");

  const recommendation = {
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
  const params = new URLSearchParams({
    source: "today-recommendation",
    initialStep: "confirm",
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

function formatProgressContext(progress: ProgressSummary) {
  const weaknesses = progress.topWeaknesses.length
    ? progress.topWeaknesses
    : [];

  if (weaknesses.length === 0) {
    return "No recent weaknesses recorded yet. Recommend a useful first practice based on system memory.";
  }

  return weaknesses
    .map(
      (weakness, index) =>
        `${index + 1}. ${weakness.label} (${weakness.type}, severity ${weakness.severity}, occurrences ${weakness.occurrences})\nEvidence: ${weakness.evidence}\nRecommended drill: ${weakness.recommendedDrill}`,
    )
    .join("\n\n");
}

function formatMaterialsContext(recentMaterials: MaterialContext[]) {
  if (recentMaterials.length === 0) {
    return "No uploaded material is available.";
  }

  return recentMaterials
    .slice(0, 5)
    .map(
      (material, index) =>
        `${index + 1}. id=${material.id}; name=${material.name}; status=${material.processingStatus}; memoryStatus=${material.memoryStatus}; confidential=${material.confidentialMode}; updatedAt=${material.updatedAt}`,
    )
    .join("\n");
}

function formatMemoryContext(memories: MemoryItem[]) {
  if (memories.length === 0) {
    return "No long-term memory is available.";
  }

  return memories
    .slice(0, 6)
    .map(
      (memory, index) =>
        `${index + 1}. ${memory.title} (${memory.type}, importance ${memory.importance}, confidence ${memory.confidence})\n${memory.summary}`,
    )
    .join("\n\n");
}

function formatScenarioOptions() {
  const goals = defaultScenarioPack.practiceGoals
    .map(
      (goal) =>
        `- ${goal.id}: ${goal.label}; defaultFocus=${goal.defaultFocusTags.join(", ")}; recommendedPersonas=${goal.recommendedPersonaIds.join(", ")}; recommendedVoices=${goal.recommendedVoicePackIds.join(", ")}`,
    )
    .join("\n");
  const personas = defaultScenarioPack.personas
    .map(
      (persona) =>
        `- ${persona.id}: ${persona.label}; style=${persona.communicationStyle}; focus=${persona.focusAreas.join(", ")}`,
    )
    .join("\n");
  const voices = defaultScenarioPack.voicePacks
    .map(
      (voicePack) =>
        `- ${voicePack.id}: ${voicePack.name}; providerVoice=${voicePack.providerVoiceName}; style=${voicePack.voiceStyle}; bestFor=${voicePack.bestFor.join(", ")}`,
    )
    .join("\n");

  return `Practice goals:\n${goals}\n\nCustomer roles:\n${personas}\n\nAI Studio voice packs:\n${voices}`;
}

function buildRecommendationPrompt(input: GenerateTodayRecommendationInput) {
  return `${TEXT_ANALYSIS_BOUNDARY}

You are generating the dashboard card "今日建议你练" for a customized English-speaking practice product for a Rokid overseas sales/solutions user.

Use the learner's real backend context. Pick exactly one practice goal, one customer role, one AI Studio voice pack, material mode, and duration.

Decision rules:
- Prioritize the most recent/high-severity weakness, but use uploaded material and memory when they make a more useful drill.
- The recommendation must be specific to Rokid overseas business conversations, not generic English learning.
- Do not invent unavailable product facts, pricing, certifications, or customer cases.
- The reason must be Chinese, concise, and explain why this is recommended today based on evidence.
- Pick IDs only from the options below.

${formatScenarioOptions()}

Backend progress context:
recentTrainingCount=${input.progress.recentTrainingCount}
${formatProgressContext(input.progress)}

Recent material context:
${formatMaterialsContext(input.recentMaterials)}

Long-term memory context:
${formatMemoryContext(input.memories)}

Return JSON only:
{
  "title": "中文标题，格式为：客户角色 · 练习目标",
  "reason": "中文推荐原因，说明来自哪个复盘/材料/记忆证据",
  "goalId": "one PracticeGoal id",
  "personaId": "one Customer role id",
  "voicePackId": "one AI Studio voice pack id",
  "materialMode": "recent_material | no_material | memory_context | specific_material",
  "materialId": "optional material id when using a specific uploaded material",
  "materialLabel": "中文或材料名",
  "durationMinutes": 8,
  "evidence": ["short evidence strings"]
}`;
}

function buildFallbackRecommendation(input: GenerateTodayRecommendationInput) {
  const topWeakness = input.progress.topWeaknesses[0];
  const goalId = topWeakness ? weaknessGoalMap[topWeakness.type] : undefined;
  const goal = findGoal(goalId ?? "application_scenarios");
  const persona = findPersona(goal.recommendedPersonaIds[0], goal.recommendedPersonaIds);
  const voicePack = findVoicePack(
    goal.recommendedVoicePackIds[0],
    goal.recommendedVoicePackIds,
  );
  const recentMaterial = input.recentMaterials.find(
    (material) =>
      material.processingStatus === "ready" &&
      material.memoryStatus !== "confidential",
  );
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
      materialMode: recentMaterial ? "recent_material" : "memory_context",
      materialId: recentMaterial?.id,
      materialLabel: recentMaterial?.name ?? "系统记忆",
      durationMinutes: 8,
      evidence,
    },
    "fallback",
  );
}

export async function generateTodayRecommendation(
  input: GenerateTodayRecommendationInput,
): Promise<TodayRecommendation> {
  if (shouldUseMockMode(input.mockMode)) {
    return buildFallbackRecommendation(input);
  }

  try {
    const payload = await generateTextJSON({
      schemaName: "today practice recommendation",
      prompt: buildRecommendationPrompt(input),
      maxTokens: 1800,
      timeoutMs: 12_000,
    });
    const recommendationPayload = recommendationPayloadSchema.parse(payload);

    return normalizeRecommendation(recommendationPayload, "ai");
  } catch {
    return buildFallbackRecommendation(input);
  }
}

export function getTodayRecommendation() {
  return buildFallbackRecommendation({
    progress: {
      recentTrainingCount: 0,
      topWeaknesses: [],
      improvedWeaknesses: [],
      recommendedDrills: [],
      history: [],
    },
    recentMaterials: [],
    memories: [],
  });
}
