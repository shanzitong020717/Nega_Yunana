import { z } from "zod";

import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";

export const prepCardSchema = z.object({
  customerContext: z.string().min(1),
  meetingGoal: z.string().min(1),
  keyTalkingPoints: z.array(z.string().min(1)),
  discoveryQuestions: z.array(z.string().min(1)),
  likelyObjections: z.array(z.string().min(1)),
  openingScript: z.string().min(1),
  mustUsePhrases: z.array(z.string().min(1)),
  doNotOverpromise: z.array(z.string().min(1)),
});

export type PrepCardPayload = z.infer<typeof prepCardSchema>;

export type GeneratePrepCardInput = {
  materialId?: string;
  customerType: string;
  industry?: string;
  countryOrRegion?: string;
  meetingGoal: string;
  knownConcerns: string[];
  trainingFocus: string[];
  materialBrief?: MaterialBriefPayload | null;
  mockMode?: boolean;
};

function shouldUseMockMode(input: GeneratePrepCardInput) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasTextAIApiKey()
  );
}

function fallbackList(items: string[], fallback: string[]) {
  return items.length > 0 ? items : fallback;
}

function generateMockPrepCard(input: GeneratePrepCardInput): PrepCardPayload {
  const contextParts = [
    input.customerType,
    input.industry ? `${input.industry} industry` : null,
    input.countryOrRegion,
  ].filter(Boolean);
  const productPoints = input.materialBrief?.productPoints ?? [
    "Real-time translated captions",
    "Hands-free access to meeting information",
  ];
  const usefulPhrases = input.materialBrief?.usefulPhrases ?? [
    "Before we jump into the product, may I first understand your use case?",
    "The key value is reducing communication friction in real time.",
  ];

  return {
    customerContext: `${contextParts.join(" · ")}. Main concerns to watch: ${fallbackList(
      input.knownConcerns,
      ["workflow fit", "privacy", "pilot value"],
    ).join(", ")}.`,
    meetingGoal: input.meetingGoal,
    keyTalkingPoints: [
      `Connect ${productPoints[0]} to the customer's workflow.`,
      "Position Rokid as a work-focused communication and information-access solution.",
      ...input.trainingFocus.map((focus) => `Practice focus: ${focus}.`),
    ],
    discoveryQuestions: [
      "What does a successful pilot look like for your team?",
      "Where do language barriers or information gaps slow the workflow today?",
      "Who from your technical or security team should join the next discussion?",
    ],
    likelyObjections: fallbackList(input.knownConcerns, [
      "How is meeting data handled?",
      "Why not just use a phone translation app?",
      "Will employees actually use this?",
    ]),
    openingScript:
      "Before we jump into the product, may I first understand your use case and what you would want to validate in a pilot?",
    mustUsePhrases: usefulPhrases,
    doNotOverpromise: [
      "Do not invent accuracy percentages, certifications, pricing, delivery timelines, or contract terms.",
      ...(input.materialBrief?.riskyClaims ?? []),
    ],
  };
}

function buildPrepCardPrompt(input: GeneratePrepCardInput) {
  return [
    "You are preparing a focused English meeting prep card for a Rokid overseas sales and solutions manager.",
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON with these keys: customerContext, meetingGoal, keyTalkingPoints, discoveryQuestions, likelyObjections, openingScript, mustUsePhrases, doNotOverpromise.",
    "Keep it specific to the customer context. Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms.",
    `Material ID: ${input.materialId ?? "none"}`,
    `Customer type: ${input.customerType}`,
    `Industry: ${input.industry ?? "unknown"}`,
    `Country or region: ${input.countryOrRegion ?? "unknown"}`,
    `Meeting goal: ${input.meetingGoal}`,
    `Known concerns: ${input.knownConcerns.join(", ") || "none"}`,
    `Training focus: ${input.trainingFocus.join(", ") || "none"}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
  ].join("\n\n");
}

function logPrepCardFallback(error: unknown) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const errorSummary =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };

  console.warn(
    "[prep-card] AI generation failed; using deterministic fallback.",
    errorSummary,
  );
}

async function generateAIPrepCard(input: GeneratePrepCardInput) {
  const parsed = await generateTextJSON({
    prompt: buildPrepCardPrompt(input),
    schemaName: "prep card",
  });

  return prepCardSchema.parse(parsed);
}

export async function generatePrepCard(
  input: GeneratePrepCardInput,
): Promise<PrepCardPayload> {
  if (shouldUseMockMode(input)) {
    return generateMockPrepCard(input);
  }

  try {
    return await generateAIPrepCard(input);
  } catch (error) {
    logPrepCardFallback(error);
    return generateMockPrepCard(input);
  }
}
