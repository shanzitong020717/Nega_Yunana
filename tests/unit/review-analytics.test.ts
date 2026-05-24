import { describe, expect, it } from "vitest";

import { buildReviewAnalyticsDraft } from "@/lib/progress/review-analytics";
import type { ReviewRecord } from "@/lib/practice/practice-session-store";

function reviewFixture(
  overrides: Partial<ReviewRecord> & Pick<ReviewRecord, "id" | "sessionId">,
): ReviewRecord {
  return {
    id: overrides.id,
    sessionId: overrides.sessionId,
    createdAt: overrides.createdAt ?? "2026-05-24T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-24T08:00:00.000Z",
    meetingOutcome: {
      summary: "The learner handled the customer question.",
      customerReaction: "Interested but cautious.",
      nextStep: "Practice a sharper answer.",
    },
    reviewSnapshot: {
      overallSummaryZh: "你能说明业务价值，但需要更短、更具体。",
      strengths: ["能把 Rokid 连接到会议效率"],
      priorityImprovements: ["少讲功能，多说客户结果"],
      phrasebookCandidateCount: 1,
      memoryCandidateCount: 1,
      nextPracticeFocus: "应用场景说明",
    },
    scores: {
      clarity: { score: 3, rationale: "Clear enough." },
      businessConfidence: { score: 3, rationale: "Needs confidence." },
      discoverySkill: { score: 3, rationale: "Needs more questions." },
      productPositioning: { score: 3, rationale: "Relevant." },
      objectionHandling: { score: 3, rationale: "Needs structure." },
      englishNaturalness: { score: 3, rationale: "Understandable." },
    },
    topImprovements: ["Lead with customer value."],
    bestMoments: ["Connected Rokid to meetings."],
    sentenceReviews: [
      {
        id: `${overrides.id}_sentence_1`,
        original: "We have translation function and it can help your meeting.",
        translationZh: "我们有翻译功能，可以帮助你们的会议。",
        quality: "needs_improvement",
        grammarIssues: [],
        wordChoiceIssues: [
          {
            type: "word_choice",
            severity: 3,
            originalFragment: "translation function",
            correction: "real-time translated captions",
            explanationZh: "translation function 偏直译。",
          },
        ],
        naturalnessIssues: [
          {
            type: "naturalness",
            severity: 3,
            originalFragment: "help your meeting",
            correction:
              "make multilingual customer meetings easier to follow",
            explanationZh: "help your meeting 不够自然。",
          },
        ],
        highlights: [
          {
            type: "customer_empathy",
            text: "meeting",
            explanationZh: "已经围绕客户会议场景回答。",
            alternatives: ["meeting workflow"],
          },
        ],
        upgradedExpression:
          "Rokid supports real-time translated captions, making multilingual customer meetings easier to follow.",
        upgradedExpressionZh:
          "Rokid 支持实时翻译字幕，让多语言客户会议更容易跟上。",
        reasonZh: "从功能转向客户结果，更自然。",
        practicePrompt: "用升级后的表达重新回答一次。",
        vocabulary: [
          {
            term: "multilingual customer meetings",
            phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈkʌstəmər ˈmiːtɪŋz/",
            chinese: "多语言客户会议",
            example:
              "Rokid makes multilingual customer meetings easier to follow.",
            sourceSentence:
              "We have translation function and it can help your meeting.",
          },
        ],
        phrasebookCandidate: {
          english:
            "Rokid supports real-time translated captions, making multilingual customer meetings easier to follow.",
          chinese:
            "Rokid 支持实时翻译字幕，让多语言客户会议更容易跟上。",
          useCase: "说明 Rokid 在多语言客户会议中的价值。",
          tags: ["review", "business-value"],
        },
      },
    ],
    sentenceUpgrades: [],
    suggestedAnswers: [],
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [
      {
        english:
          "We can start with a focused pilot and involve your IT team early.",
        chinese:
          "我们可以先从聚焦试点开始，并尽早让 IT 团队参与。",
        category: "Objection Handling",
        useCase: "回应试点和隐私安全问题。",
        simpleVersion: undefined,
        professionalVersion: undefined,
        relatedProductPoint: undefined,
        relatedObjection: undefined,
        tags: ["pilot", "privacy"],
        source: "review",
        masteryStatus: "needs_practice",
      },
    ],
    weaknessUpdates: [
      {
        type: "feature_only_talk",
        severity: 3,
        evidence: "The learner started from features before customer value.",
        recommendedDrill: "功能转价值练习",
      },
    ],
    memoryCandidates: [
      {
        type: "speaking_pattern",
        title: "Feature-first answering pattern",
        summary:
          "The learner often starts with product features before customer workflow value.",
        evidence: ["translation function"],
        sensitivity: "low",
        confidence: 0.82,
        importance: 4,
        enabledForAi: true,
      },
    ],
    nextSessionRecommendation: {
      focus: "应用场景说明",
      drill: "功能转价值练习",
      prompt: "用客户结果重说产品能力。",
    },
  };
}

describe("buildReviewAnalyticsDraft", () => {
  it("aggregates recurring mistakes, growth signals, phrase growth, and next training plan", () => {
    const draft = buildReviewAnalyticsDraft({
      range: "7d",
      now: "2026-05-24T12:00:00.000Z",
      reviews: [
        reviewFixture({ id: "review_1", sessionId: "session_1" }),
        reviewFixture({
          id: "review_2",
          sessionId: "session_2",
          createdAt: "2026-05-23T08:00:00.000Z",
          updatedAt: "2026-05-23T08:00:00.000Z",
        }),
      ],
      sessions: [],
      memories: [],
    });

    expect(draft.trainingCount).toBe(2);
    expect(draft.sourceReviewIds).toEqual(["review_1", "review_2"]);
    expect(draft.recurringMistakes[0]).toMatchObject({
      category: "word_choice",
      occurrenceCount: 2,
      averageSeverity: 3,
      recommendedDrill: "功能转价值练习",
    });
    expect(draft.naturalnessPatterns[0]?.betterExpression).toContain(
      "multilingual customer meetings",
    );
    expect(draft.topGrowthSignals[0]?.summaryZh).toContain("客户会议场景");
    expect(draft.phraseGrowth.vocabularyItems[0]).toMatchObject({
      term: "multilingual customer meetings",
      count: 2,
    });
    expect(draft.phraseGrowth.reusableSentences[0]?.english).toContain(
      "focused pilot",
    );
    expect(draft.nextTrainingPlan).toMatchObject({
      goalId: "application_scenarios",
      materialMode: "memory_context",
    });
  });

  it("returns an empty trend state when there are fewer than two reviews", () => {
    const draft = buildReviewAnalyticsDraft({
      range: "30d",
      now: "2026-05-24T12:00:00.000Z",
      reviews: [reviewFixture({ id: "review_single", sessionId: "session_single" })],
      sessions: [],
      memories: [],
    });

    expect(draft.trainingCount).toBe(1);
    expect(draft.summaryZh).toContain("数据还不够形成长期趋势");
    expect(draft.recurringMistakes).toEqual([]);
    expect(draft.aiGenerated).toBe(false);
  });
});
