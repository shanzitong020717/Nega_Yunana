import { z } from "zod";

import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import { nonEmptyString, stringArraySchema } from "./shared";

export const sentenceUpgradeSchema = z.object({
  original: nonEmptyString("Original sentence is required"),
  naturalEnglish: nonEmptyString("Natural English sentence is required"),
  chineseExplanation: nonEmptyString("Chinese explanation is required"),
  practicePrompt: nonEmptyString("Practice prompt is required"),
});

export const meetingOutcomeSchema = z.object({
  summary: nonEmptyString("Meeting outcome summary is required"),
  customerReaction: nonEmptyString("Customer reaction is required"),
  nextStep: nonEmptyString("Next step is required"),
});

export const scoreItemSchema = z.object({
  score: z.number().int().min(1).max(5),
  rationale: nonEmptyString("Score rationale is required"),
});

export const businessScorecardSchema = z.object({
  clarity: scoreItemSchema,
  businessConfidence: scoreItemSchema,
  discoverySkill: scoreItemSchema,
  productPositioning: scoreItemSchema,
  objectionHandling: scoreItemSchema,
  englishNaturalness: scoreItemSchema,
});

export const materialCoverageSchema = z.object({
  covered: stringArraySchema,
  missed: stringArraySchema,
  unclear: stringArraySchema,
});

export const objectionFrameworkStepSchema = z.enum([
  "Acknowledge",
  "Clarify",
  "Position",
  "Support",
  "Next Step",
]);

export const objectionFrameworkReviewSchema = z.object({
  requiredSteps: z.array(objectionFrameworkStepSchema).min(1),
  usedSteps: z.array(objectionFrameworkStepSchema).default([]),
  missingSteps: z.array(objectionFrameworkStepSchema).default([]),
  coachingNote: nonEmptyString("Objection framework coaching note is required"),
});

export const weaknessUpdateInputSchema = z.object({
  type: z.enum(
    [
      "long_answers",
      "feature_only_talk",
      "weak_discovery",
      "unclear_positioning",
      "weak_objection_handling",
      "repetitive_vocabulary",
      "missing_next_step",
      "grammar_accuracy",
      "pronunciation_clarity",
      "fluency",
    ],
    {
      error: "Invalid weakness type",
    },
  ),
  severity: z.number().int().min(1).max(5),
  evidence: nonEmptyString("Weakness evidence is required"),
  recommendedDrill: nonEmptyString("Recommended drill is required"),
});

export const nextSessionRecommendationSchema = z.object({
  focus: nonEmptyString("Next session focus is required"),
  drill: nonEmptyString("Next session drill is required"),
  prompt: nonEmptyString("Next session prompt is required"),
});

export const createReviewInputSchema = z.object({
  meetingOutcome: meetingOutcomeSchema,
  scores: businessScorecardSchema,
  topImprovements: z
    .array(nonEmptyString("Improvement is required"))
    .min(1)
    .max(3),
  bestMoments: stringArraySchema,
  sentenceUpgrades: z.array(sentenceUpgradeSchema).default([]),
  materialCoverage: materialCoverageSchema,
  objectionFramework: objectionFrameworkReviewSchema.optional(),
  phrasebookSuggestions: z.array(createPhraseInputSchema).default([]),
  weaknessUpdates: z.array(weaknessUpdateInputSchema).default([]),
  nextSessionRecommendation: nextSessionRecommendationSchema,
});

export type ObjectionFrameworkStep = z.infer<typeof objectionFrameworkStepSchema>;
export type ObjectionFrameworkReview = z.infer<
  typeof objectionFrameworkReviewSchema
>;
export type WeaknessUpdateInput = z.infer<typeof weaknessUpdateInputSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type PracticeReviewPayload = z.infer<typeof createReviewInputSchema>;
