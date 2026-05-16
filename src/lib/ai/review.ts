import { ZodError } from "zod";

import { objections } from "@/data/objections";
import type { CustomerPersona } from "@/data/personas";
import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import type { PrepCardPayload } from "@/lib/ai/prep-card";
import { generateTextJSON, hasTextAIApiKey } from "@/lib/ai/text-client";
import type { PracticeSessionRecord } from "@/lib/practice/practice-session-store";
import type { TranscriptTurnInput } from "@/lib/validation/practice";
import {
  createReviewInputSchema,
  type ObjectionFrameworkReview,
  type ObjectionFrameworkStep,
  type PracticeReviewPayload,
} from "@/lib/validation/reviews";

export type GeneratePracticeReviewInput = {
  practiceSession: PracticeSessionRecord;
  transcriptTurns: TranscriptTurnInput[];
  persona: CustomerPersona;
  materialBrief?: MaterialBriefPayload | null;
  prepCard?: PrepCardPayload | null;
  mockMode?: boolean;
};

export class ReviewGenerationRetryableError extends Error {
  constructor(message = "AI review output was invalid. Please retry.") {
    super(message);
    this.name = "ReviewGenerationRetryableError";
  }
}

function shouldUseMockMode(input: Pick<GeneratePracticeReviewInput, "mockMode">) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasTextAIApiKey()
  );
}

function listText(items: string[] | undefined, fallback: string) {
  return items && items.length > 0 ? items.join(", ") : fallback;
}

function firstUserTurn(transcriptTurns: TranscriptTurnInput[]) {
  return (
    transcriptTurns.find((turn) => turn.speaker === "user")?.text ??
    "We have translation function and it can help your meeting."
  );
}

const defaultObjectionFrameworkSteps: ObjectionFrameworkStep[] = [
  "Acknowledge",
  "Clarify",
  "Position",
  "Support",
  "Next Step",
];

const stepDetectionPatterns: Record<ObjectionFrameworkStep, RegExp[]> = {
  Acknowledge: [
    /\bfair question\b/i,
    /\bgood question\b/i,
    /\bi understand\b/i,
    /\bthat is reasonable\b/i,
    /\bimportant concern\b/i,
    /\bvalid concern\b/i,
    /\byou are right\b/i,
  ],
  Clarify: [
    /\?/,
    /\bcould you\b/i,
    /\bcan you\b/i,
    /\bmay i ask\b/i,
    /\bwhat\b/i,
    /\bwhich\b/i,
    /\bhow\b/i,
    /\bwho\b/i,
    /\bwhere\b/i,
    /\bwhen\b/i,
    /\bwould it make sense\b/i,
  ],
  Position: [
    /\brokid\b/i,
    /\bdesigned for\b/i,
    /\bposition\b/i,
    /\bhands-free\b/i,
    /\breal[- ]time\b/i,
    /\bworkflow\b/i,
    /\bbusiness value\b/i,
    /\bcommunication friction\b/i,
  ],
  Support: [
    /\bpilot\b/i,
    /\btest\b/i,
    /\bevaluate\b/i,
    /\bexample\b/i,
    /\bdata flow\b/i,
    /\bsuccess metrics\b/i,
    /\bcase\b/i,
    /\bproof\b/i,
  ],
  "Next Step": [
    /\bnext step\b/i,
    /\bfollow up\b/i,
    /\bschedule\b/i,
    /\bset up\b/i,
    /\blet's\b/i,
    /\blet us\b/i,
    /\bi suggest we\b/i,
    /\bwe can define\b/i,
    /\btechnical follow-up\b/i,
    /\bwho should join\b/i,
  ],
};

function detectObjectionFramework(
  input: GeneratePracticeReviewInput,
): ObjectionFrameworkReview | undefined {
  if (
    input.practiceSession.mode !== "objection_challenge" &&
    !input.practiceSession.sourceObjectionId
  ) {
    return undefined;
  }

  const sourceObjection = objections.find(
    (objection) => objection.id === input.practiceSession.sourceObjectionId,
  );
  const requiredSteps = sourceObjection
    ? [...sourceObjection.answerFramework]
    : defaultObjectionFrameworkSteps;
  const userText = input.transcriptTurns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => turn.text)
    .join("\n");
  const usedSteps = requiredSteps.filter((step) =>
    stepDetectionPatterns[step].some((pattern) => pattern.test(userText)),
  );
  const missingSteps = requiredSteps.filter((step) => !usedSteps.includes(step));
  const coachingNote =
    missingSteps.length === 0
      ? "You covered all five objection-handling steps. Keep the answer concise and connect the final step to the customer's workflow."
      : `Missing: ${missingSteps.join(", ")}. Add the missing step${missingSteps.length > 1 ? "s" : ""} before moving to the next topic.`;

  return {
    requiredSteps,
    usedSteps,
    missingSteps,
    coachingNote,
  };
}

export function parseReviewPayload(value: unknown): PracticeReviewPayload {
  try {
    return createReviewInputSchema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ReviewGenerationRetryableError(error.issues[0]?.message);
    }

    throw error;
  }
}

function generateMockReview(
  input: GeneratePracticeReviewInput,
): PracticeReviewPayload {
  const userSentence = firstUserTurn(input.transcriptTurns);
  const productPoint =
    input.materialBrief?.productPoints[0] ?? "Real-time translated captions";
  const customerValue =
    input.materialBrief?.customerValue[0] ??
    "Reduce communication friction in multilingual meetings";
  const focus = listText(
    input.practiceSession.trainingFocus,
    "business value and customer discovery",
  );
  const objectionFramework = detectObjectionFramework(input);

  return parseReviewPayload({
    meetingOutcome: {
      summary: `${input.persona.name} understood the core Rokid value, but still needs clearer workflow proof and a more concrete next step.`,
      customerReaction:
        "Interested, technically cautious, and looking for practical pilot evidence.",
      nextStep:
        "Follow up with a focused pilot discussion that includes workflow, IT review, and success metrics.",
    },
    scores: {
      clarity: {
        score: 4,
        rationale:
          "The learner answered directly enough for the customer to follow.",
      },
      businessConfidence: {
        score: 3,
        rationale:
          "Some answers started from product features instead of customer value.",
      },
      discoverySkill: {
        score: 3,
        rationale:
          "The conversation needs more questions about workflow, stakeholders, and success criteria.",
      },
      productPositioning: {
        score: 4,
        rationale: `The learner connected Rokid to ${customerValue}.`,
      },
      objectionHandling: {
        score: 3,
        rationale:
          "Privacy and workflow concerns were acknowledged, but the answer should invite a technical review instead of staying general.",
      },
      englishNaturalness: {
        score: 3,
        rationale:
          "The English was understandable, with several phrases that can be upgraded into more natural business English.",
      },
    },
    topImprovements: [
      "Turn product features into customer business outcomes before explaining details.",
      "Ask one discovery question before positioning Rokid as the solution.",
      "Close each answer with a concrete next step, such as a pilot scope or IT follow-up.",
    ],
    bestMoments: [
      `You kept the answer connected to ${customerValue}.`,
      "You avoided making unsupported claims about pricing, compliance, or accuracy.",
    ],
    sentenceUpgrades: [
      {
        status: "needs_upgrade",
        original: userSentence,
        naturalEnglish: `Rokid supports ${productPoint.toLowerCase()}, helping users follow multilingual conversations more smoothly during customer meetings.`,
        chineseExplanation:
          "不要只说“我们有某个功能”，而是说明它如何帮助客户在真实会议中更顺畅地沟通。",
        practicePrompt:
          "Explain this value again in your own words, then ask one follow-up question about the customer's workflow.",
      },
      {
        status: "needs_upgrade",
        original: "You can use it for pilot and review privacy later.",
        naturalEnglish:
          "We can start with a focused pilot and involve your IT team early to review the data flow and deployment requirements.",
        chineseExplanation:
          "这句话把“之后再看隐私”升级成更专业的企业客户表达：提前邀请 IT 参与，确认数据流和部署要求。",
        practicePrompt:
          "Say this as a confident next-step proposal to a technical buyer.",
      },
      {
        status: "already_natural",
        original:
          "A practical next step would be to run a small pilot with one team.",
        positiveFeedback:
          "This sentence is already natural, specific, and suitable for a business meeting.",
        chineseExplanation: "这句话清楚表达了下一步，并且范围具体。",
        practicePrompt:
          "Reuse this structure when proposing a pilot for another customer scenario.",
      },
    ],
    materialCoverage: {
      covered: [productPoint],
      missed: ["Pilot success metrics", "Stakeholder map for IT review"],
      unclear: ["How meeting data flow should be explained without overpromising"],
    },
    ...(objectionFramework ? { objectionFramework } : {}),
    phrasebookSuggestions: [
      {
        category: "Business Value",
        english:
          "The key value is reducing communication friction in real time.",
        chinese: "核心价值是实时降低沟通阻力。",
        useCase: "Explain Rokid business value in an overseas customer meeting.",
        simpleVersion: "It helps people communicate more smoothly in real time.",
        professionalVersion:
          "The key value is reducing communication friction in real time, especially when teams need to follow multilingual conversations without breaking meeting flow.",
        relatedProductPoint: productPoint,
        relatedObjection: "Why not just use a phone translation app?",
        tags: ["business-value", "translation", "customer-meeting"],
        source: "review",
        masteryStatus: "needs_practice",
      },
    ],
    weaknessUpdates: [
      {
        type: "feature_only_talk",
        severity: 3,
        evidence:
          "The answer started with a feature statement before explaining the customer outcome.",
        recommendedDrill: "Feature-to-value conversion drill",
      },
      {
        type: "weak_discovery",
        severity: 2,
        evidence:
          "The learner could ask more about workflow, buyer criteria, and pilot success.",
        recommendedDrill: "Ask two discovery questions before presenting.",
      },
    ],
    memoryCandidates: [
      {
        type: "speaking_pattern",
        title: "Feature-first answering pattern",
        summary:
          "The learner tends to start with product functions before translating them into customer workflow value.",
        sensitivity: "low",
        confidence: 0.82,
      },
      {
        type: "practice_focus",
        title: "Needs stronger discovery before positioning",
        summary:
          "Future sessions should prompt the learner to ask about workflow, stakeholders, and pilot success criteria before presenting Rokid.",
        sensitivity: "low",
        confidence: 0.78,
      },
    ],
    nextSessionRecommendation: {
      focus,
      drill: "Technical buyer Q&A with privacy and workflow-fit objections.",
      prompt:
        "Practice explaining real-time translated captions, then ask the customer what a successful pilot would need to prove.",
    },
  });
}

function buildReviewPrompt(input: GeneratePracticeReviewInput) {
  return [
    "You are generating a structured after-practice review for a Rokid overseas sales and solution professional.",
    "Return strict JSON only. Do not include Markdown.",
    "The JSON must include meetingOutcome, scores, topImprovements, bestMoments, sentenceUpgrades, materialCoverage, phrasebookSuggestions, weaknessUpdates, memoryCandidates, and nextSessionRecommendation.",
    "If the practice session is an objection_challenge, include objectionFramework with requiredSteps, usedSteps, missingSteps, and coachingNote. Score these five steps: Acknowledge, Clarify, Position, Support, Next Step.",
    "For sentenceUpgrades, classify each user sentence as either needs_upgrade or already_natural.",
    "If status is needs_upgrade, include original, naturalEnglish, chineseExplanation, and practicePrompt.",
    "If status is already_natural, do not rewrite the sentence. Include original, positiveFeedback, chineseExplanation, and practicePrompt instead.",
    "Only rewrite sentences that sound unnatural, vague, overly literal, feature-only, or unsuitable for a business conversation.",
    "Generate memoryCandidates after each review. Each candidate must include type, title, summary, sensitivity, and confidence. sensitivity must be low, medium, or high. confidence must be a number from 0 to 1.",
    "Memory candidates should focus on durable user traits, recurring speaking patterns, useful customer context, material facts worth reusing, or next-session learning focus. Avoid storing secrets or confidential customer details.",
    "The nextSessionRecommendation must give one concrete next practice focus, drill, and prompt.",
    "Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms not provided in the material.",
    `Practice session: ${JSON.stringify(input.practiceSession)}`,
    `Persona: ${JSON.stringify(input.persona)}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
    `Prep card: ${JSON.stringify(input.prepCard ?? {})}`,
    `Transcript: ${JSON.stringify(input.transcriptTurns)}`,
  ].join("\n\n");
}

export async function generatePracticeReview(
  input: GeneratePracticeReviewInput,
): Promise<PracticeReviewPayload> {
  if (shouldUseMockMode(input)) {
    return generateMockReview(input);
  }

  const parsed = await generateTextJSON({
    prompt: buildReviewPrompt(input),
    schemaName: "practice review",
  });

  try {
    return parseReviewPayload(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ReviewGenerationRetryableError();
    }

    throw error;
  }
}
