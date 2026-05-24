import { ZodError } from "zod";

import { objections } from "@/data/objections";
import type { CustomerPersona } from "@/data/personas";
import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import type { PrepCardPayload } from "@/lib/ai/prep-card";
import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";
import type { PracticeSessionRecord } from "@/lib/practice/practice-session-store";
import type { TranscriptTurnInput } from "@/lib/validation/practice";
import {
  createReviewInputSchema,
  type ObjectionFrameworkReview,
  type ObjectionFrameworkStep,
  type PracticeReviewPayload,
} from "@/lib/validation/reviews";
import type { SuggestedAnswerRecord } from "@/lib/validation/suggested-answer";

export type GeneratePracticeReviewInput = {
  practiceSession: PracticeSessionRecord;
  transcriptTurns: TranscriptTurnInput[];
  persona: CustomerPersona;
  materialBrief?: MaterialBriefPayload | null;
  prepCard?: PrepCardPayload | null;
  mockMode?: boolean;
  suggestedAnswers?: SuggestedAnswerRecord[];
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
  const suggestedAnswers = input.suggestedAnswers ?? [];
  const suggestedAnswerPhrases = suggestedAnswers.map(
    (suggestion) => suggestion.phrasebookEntry,
  );

  return parseReviewPayload({
    meetingOutcome: {
      summary: `${input.persona.name} understood the core Rokid value, but still needs clearer workflow proof and a more concrete next step.`,
      customerReaction:
        "Interested, technically cautious, and looking for practical pilot evidence.",
      nextStep:
        "Follow up with a focused pilot discussion that includes workflow, IT review, and success metrics.",
    },
    reviewSnapshot: {
      overallSummaryZh:
        "你能够把 Rokid 的产品能力连接到客户会议场景，但回答还需要更短、更具体，并且先问清客户工作流。",
      strengths: [
        `能围绕 ${customerValue} 表达价值`,
        "没有随意承诺价格、认证或准确率",
      ],
      priorityImprovements: [
        "先确认客户场景，再展开产品能力",
        "把功能表述升级成客户结果",
        "每个回答用一个明确下一步收尾",
      ],
      phrasebookCandidateCount: 2 + suggestedAnswerPhrases.length,
      memoryCandidateCount: 2,
      nextPracticeFocus: focus,
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
    sentenceReviews: [
      {
        id: "sentence_review_value_1",
        original: userSentence,
        translationZh: "我们有翻译功能，可以帮助你们的会议。",
        quality: "needs_improvement",
        grammarIssues: [],
        wordChoiceIssues: [
          {
            type: "word_choice",
            severity: 3,
            originalFragment: "translation function",
            correction: productPoint,
            explanationZh:
              "translation function 偏直译，也偏功能罗列；用具体产品能力更符合商务介绍。",
          },
        ],
        naturalnessIssues: [
          {
            type: "naturalness",
            severity: 3,
            originalFragment: "help your meeting",
            correction:
              "make multilingual customer meetings easier to follow",
            explanationZh:
              "help your meeting 不够自然，改成“让多语言客户会议更容易跟上”更清楚表达客户结果。",
          },
        ],
        highlights: [
          {
            type: "customer_empathy",
            text: "meeting",
            explanationZh: "你已经在围绕客户会议场景表达价值，这是正确方向。",
            alternatives: ["meeting flow", "customer meeting workflow"],
          },
        ],
        upgradedExpression: `Rokid supports ${productPoint.toLowerCase()}, making multilingual customer meetings easier to follow.`,
        upgradedExpressionZh:
          "Rokid 支持实时翻译字幕，让多语言客户会议更容易跟上。",
        reasonZh:
          "这句话把“功能”变成“客户获得的会议体验”，更自然，也更适合海外商务沟通。",
        practicePrompt:
          "用升级后的句式重新回答一次客户：先说场景，再说 Rokid 带来的结果。",
        vocabulary: [
          {
            term: "multilingual customer meetings",
            phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈkʌstəmər ˈmiːtɪŋz/",
            chinese: "多语言客户会议",
            example:
              "Rokid makes multilingual customer meetings easier to follow.",
            sourceSentence: userSentence,
          },
          {
            term: "meeting flow",
            phonetic: "/ˈmiːtɪŋ floʊ/",
            chinese: "会议流程、会议节奏",
            example: "The captions help keep the meeting flow smooth.",
            sourceSentence: userSentence,
          },
        ],
        phrasebookCandidate: {
          english: `Rokid supports ${productPoint.toLowerCase()}, making multilingual customer meetings easier to follow.`,
          chinese:
            "Rokid 支持实时翻译字幕，让多语言客户会议更容易跟上。",
          useCase: "说明 Rokid 在多语言客户会议中的价值。",
          tags: ["review", "sentence-review", "business-value"],
        },
      },
      {
        id: "sentence_review_pilot_1",
        original: "You can use it for pilot and review privacy later.",
        translationZh: "你们可以用于试点，之后再看隐私。",
        quality: "needs_improvement",
        grammarIssues: [
          {
            type: "grammar",
            severity: 2,
            originalFragment: "use it for pilot",
            correction: "run a pilot",
            explanationZh:
              "英文商务语境中通常说 run a pilot，而不是 use it for pilot。",
          },
        ],
        wordChoiceIssues: [
          {
            type: "business_tone",
            severity: 4,
            originalFragment: "review privacy later",
            correction:
              "involve your IT team early to review data flow and deployment requirements",
            explanationZh:
              "企业客户对隐私安全很敏感，“later”会显得不够重视，应改成提前纳入 IT 审查。",
          },
        ],
        naturalnessIssues: [
          {
            type: "naturalness",
            severity: 3,
            originalFragment: "review privacy later",
            correction:
              "review the data flow and deployment requirements early",
            explanationZh:
              "改写后更专业，也避免让客户觉得隐私安全被推迟处理。",
          },
        ],
        highlights: [
          {
            type: "clear_next_step",
            text: "pilot",
            explanationZh: "你提出了试点方向，这是商务推进中很重要的下一步。",
            alternatives: ["focused pilot", "pilot scope"],
          },
        ],
        upgradedExpression:
          "We can start with a focused pilot and involve your IT team early to review the data flow and deployment requirements.",
        upgradedExpressionZh:
          "我们可以先从一个聚焦的试点开始，并尽早让你们的 IT 团队一起审查数据流和部署要求。",
        reasonZh:
          "这句话既保留了试点推进，又把隐私安全放到更专业、更可信的位置。",
        practicePrompt:
          "把这句话作为技术负责人追问隐私和部署时的下一步回应。",
        vocabulary: [
          {
            term: "focused pilot",
            phonetic: "/ˈfoʊkəst ˈpaɪlət/",
            chinese: "聚焦试点",
            example: "We can start with a focused pilot.",
            sourceSentence:
              "You can use it for pilot and review privacy later.",
          },
          {
            term: "data flow",
            phonetic: "/ˈdeɪtə floʊ/",
            chinese: "数据流",
            example: "Your IT team can review the data flow early.",
            sourceSentence:
              "You can use it for pilot and review privacy later.",
          },
        ],
        phrasebookCandidate: {
          english:
            "We can start with a focused pilot and involve your IT team early to review the data flow and deployment requirements.",
          chinese:
            "我们可以先从一个聚焦的试点开始，并尽早让你们的 IT 团队一起审查数据流和部署要求。",
          useCase: "回应客户关于试点、隐私和部署边界的问题。",
          tags: ["review", "sentence-review", "pilot", "privacy"],
        },
      },
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
    suggestedAnswers,
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
      ...suggestedAnswerPhrases,
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
        evidence: [
          `User answer: ${userSentence}`,
          "Review recommendation: explain customer outcome before product detail.",
        ],
        sensitivity: "low",
        confidence: 0.82,
        importance: 4,
        enabledForAi: true,
      },
      {
        type: "practice_focus",
        title: "Needs stronger discovery before positioning",
        summary:
          "Future sessions should prompt the learner to ask about workflow, stakeholders, and pilot success criteria before presenting Rokid.",
        evidence: [
          "The conversation needs more questions about workflow, stakeholders, and pilot success.",
        ],
        sensitivity: "low",
        confidence: 0.78,
        importance: 4,
        enabledForAi: true,
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
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON only. Do not include Markdown.",
    "The JSON must include meetingOutcome, reviewSnapshot, scores, topImprovements, bestMoments, sentenceReviews, sentenceUpgrades, materialCoverage, phrasebookSuggestions, weaknessUpdates, memoryCandidates, and nextSessionRecommendation.",
    "reviewSnapshot must be a Chinese 30-second summary with overallSummaryZh, 1-3 strengths, 1-3 priorityImprovements, phrasebookCandidateCount, memoryCandidateCount, and nextPracticeFocus.",
    "For sentenceReviews, evaluate each meaningful user speaking turn. Focus on what the learner said, not the AI customer.",
    "Each sentenceReview must include id, original, translationZh, quality, grammarIssues, wordChoiceIssues, naturalnessIssues, highlights, reasonZh, practicePrompt, vocabulary, and optional phrasebookCandidate.",
    "Use grammarIssues for grammar errors, wordChoiceIssues for wrong or weak wording, and naturalnessIssues for unnatural, verbose, literal, or business-inappropriate wording.",
    "Each issue must include type, severity from 1 to 5, originalFragment, correction, and explanationZh.",
    "Each highlight must praise something the learner did well, such as advanced words, business tone, good structure, synonym usage, clear next step, or customer empathy.",
    "If a sentence is excellent or already natural, mark quality as excellent or good, praise it in highlights and reasonZh, and do not force an upgradedExpression.",
    "Do not rewrite sentences that are already natural.",
    "For weak but useful sentences, include upgradedExpression and upgradedExpressionZh. The upgraded expression must be more natural, concise, and suitable for the selected customer role and business context.",
    "Vocabulary must be generated from the actual reviewed sentence or upgraded expression. Include at least two useful items when there is enough content, with term, phonetic, chinese, example, and sourceSentence.",
    "phrasebookCandidate should only be included when the upgraded or praised sentence is reusable in future Rokid sales conversations.",
    "If the practice session is an objection_challenge, include objectionFramework with requiredSteps, usedSteps, missingSteps, and coachingNote. Score these five steps: Acknowledge, Clarify, Position, Support, Next Step.",
    "For sentenceUpgrades, classify each user sentence as either needs_upgrade or already_natural.",
    "If status is needs_upgrade, include original, naturalEnglish, chineseExplanation, and practicePrompt.",
    "If status is already_natural, do not rewrite the sentence. Include original, positiveFeedback, chineseExplanation, and practicePrompt instead.",
    "Only rewrite sentences that sound unnatural, vague, overly literal, feature-only, or unsuitable for a business conversation.",
    "Generate memoryCandidates after each review. Each candidate must include type, title, summary, evidence, sensitivity, confidence, importance, and enabledForAi. sensitivity must be low, medium, or high. confidence must be a number from 0 to 1. importance must be 1 to 5.",
    "Memory candidates should focus on durable user traits, recurring speaking patterns, useful customer context, material facts worth reusing, or next-session learning focus. Avoid storing secrets or confidential customer details.",
    "The nextSessionRecommendation must give one concrete next practice focus, drill, and prompt.",
    "If suggestedAnswers are provided, keep them in the suggestedAnswers field and include their phrasebookEntry items in phrasebookSuggestions.",
    "Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms not provided in the material.",
    `Practice session: ${JSON.stringify(input.practiceSession)}`,
    `Persona: ${JSON.stringify(input.persona)}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
    `Prep card: ${JSON.stringify(input.prepCard ?? {})}`,
    `Transcript: ${JSON.stringify(input.transcriptTurns)}`,
    `Suggested answers used during live practice: ${JSON.stringify(input.suggestedAnswers ?? [])}`,
  ].join("\n\n");
}

function attachSuggestedAnswers(
  review: PracticeReviewPayload,
  suggestedAnswers: SuggestedAnswerRecord[] | undefined,
) {
  if (!suggestedAnswers || suggestedAnswers.length === 0) {
    return review;
  }

  return parseReviewPayload({
    ...review,
    suggestedAnswers,
    phrasebookSuggestions: [
      ...review.phrasebookSuggestions,
      ...suggestedAnswers.map((suggestion) => suggestion.phrasebookEntry),
    ],
  });
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
    return attachSuggestedAnswers(
      parseReviewPayload(parsed),
      input.suggestedAnswers,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ReviewGenerationRetryableError();
    }

    throw error;
  }
}
