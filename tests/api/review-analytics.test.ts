import { afterEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY:
    "DeepSeek text analysis boundary: Use DeepSeek only for offline JSON text analysis outside the realtime audio loop.",
  generateTextJSON: generateTextJSONMock,
}));

import {
  GET as getReviewAnalytics,
  POST as refreshReviewAnalytics,
} from "@/app/api/review-analytics/route";
import { saveReviewRecord } from "@/lib/practice/practice-session-store";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

function reviewPayload(sentence: string): PracticeReviewPayload {
  return {
    meetingOutcome: {
      summary: "The learner completed a practice session.",
      customerReaction: "Interested.",
      nextStep: "Practice again.",
    },
    reviewSnapshot: {
      overallSummaryZh: "你能说明业务价值，但需要更清晰。",
      strengths: ["能连接到客户会议"],
      priorityImprovements: ["减少功能堆砌"],
      phrasebookCandidateCount: 1,
      memoryCandidateCount: 1,
      nextPracticeFocus: "应用场景说明",
    },
    scores: {
      clarity: { score: 3, rationale: "Clear enough." },
      businessConfidence: { score: 3, rationale: "Needs detail." },
      discoverySkill: { score: 3, rationale: "Needs discovery." },
      productPositioning: { score: 3, rationale: "Relevant." },
      objectionHandling: { score: 3, rationale: "Needs structure." },
      englishNaturalness: { score: 3, rationale: "Understandable." },
    },
    topImprovements: ["Lead with customer value."],
    bestMoments: ["Mentioned meeting context."],
    sentenceReviews: [
      {
        id: `sentence_${crypto.randomUUID()}`,
        original: sentence,
        translationZh: "我们有翻译功能。",
        quality: "needs_improvement",
        grammarIssues: [],
        wordChoiceIssues: [
          {
            type: "word_choice",
            severity: 3,
            originalFragment: "translation function",
            correction: "real-time translated captions",
            explanationZh: "改成更具体的产品能力。",
          },
        ],
        naturalnessIssues: [],
        highlights: [],
        upgradedExpression: "Rokid supports real-time translated captions.",
        upgradedExpressionZh: "Rokid 支持实时翻译字幕。",
        reasonZh: "更自然。",
        practicePrompt: "重说一次。",
        vocabulary: [],
      },
    ],
    sentenceUpgrades: [],
    suggestedAnswers: [],
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [],
    weaknessUpdates: [
      {
        type: "feature_only_talk",
        severity: 3,
        evidence: "The learner started from features.",
        recommendedDrill: "功能转价值练习",
      },
    ],
    memoryCandidates: [],
    nextSessionRecommendation: {
      focus: "应用场景说明",
      drill: "功能转价值练习",
      prompt: "从客户结果开始。",
    },
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("review analytics API", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
  });

  it("returns a long-term review snapshot for a valid range", async () => {
    saveReviewRecord(
      `session_analytics_api_${crypto.randomUUID()}_1`,
      reviewPayload("We have translation function."),
    );
    saveReviewRecord(
      `session_analytics_api_${crypto.randomUUID()}_2`,
      reviewPayload("We have translation function for your meeting."),
    );
    generateTextJSONMock.mockImplementationOnce(async (input: { prompt: string }) => ({
      id: "review_analytics_7d",
      range: "7d",
      generatedAt: "2026-05-24T09:00:00.000Z",
      staleAfter: "2026-05-24T23:59:59.999Z",
      sourceReviewIds: ["review_1", "review_2"],
      sourceSessionIds: ["session_1", "session_2"],
      trainingCount: 2,
      summaryZh: input.prompt.includes("长期复盘")
        ? "近 7 天你需要减少功能堆砌。"
        : "长期复盘总结。",
      topGrowthSignals: [],
      recurringMistakes: [],
      naturalnessPatterns: [],
      phraseGrowth: {
        newPhraseCount: 0,
        reviewGeneratedPhraseCount: 0,
        vocabularyItems: [],
        reusableSentences: [],
      },
      memoryInsights: [],
      nextTrainingPlan: {
        title: "企业买家 · 应用场景说明",
        reasonZh: "继续练习客户价值。",
        goalId: "application_scenarios",
        mode: "customer_qa",
        personaId: "enterprise_buyer",
        voicePackId: "kore-firm",
        materialMode: "memory_context",
        focusTags: ["应用场景说明"],
        estimatedMinutes: 8,
      },
      aiGenerated: true,
    }));

    const response = await getReviewAnalytics(
      new Request("http://localhost/api/review-analytics?range=7d"),
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.analytics).toMatchObject({
      range: "7d",
      summaryZh: expect.any(String),
      trainingCount: expect.any(Number),
    });
  });

  it("rejects invalid ranges", async () => {
    const response = await getReviewAnalytics(
      new Request("http://localhost/api/review-analytics?range=90d"),
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload.error).toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("supports forced refresh through POST", async () => {
    const response = await refreshReviewAnalytics(
      new Request("http://localhost/api/review-analytics", {
        method: "POST",
        body: JSON.stringify({ range: "7d" }),
      }),
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.analytics).toMatchObject({
      range: "7d",
    });
    expect(payload.refreshed).toBe(true);
  });
});
