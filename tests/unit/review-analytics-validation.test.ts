import { describe, expect, it } from "vitest";

import { reviewAnalyticsSnapshotSchema } from "@/lib/validation/review-analytics";

describe("review analytics validation", () => {
  it("accepts a complete long-term review analytics snapshot", () => {
    const parsed = reviewAnalyticsSnapshotSchema.parse({
      id: "review_analytics_7d",
      range: "7d",
      generatedAt: "2026-05-24T09:00:00.000Z",
      staleAfter: "2026-05-24T23:59:59.999Z",
      sourceReviewIds: ["review_1", "review_2"],
      sourceSessionIds: ["session_1", "session_2"],
      trainingCount: 2,
      summaryZh:
        "近 7 天你更能说明 Rokid 的会议价值，但部署和隐私回答仍然偏长。",
      topGrowthSignals: [
        {
          id: "growth_business_value",
          title: "业务价值表达更清楚",
          summaryZh: "你开始把实时字幕连接到多语言会议效率。",
          evidence: ["Rokid makes multilingual meetings easier to follow."],
          confidence: 0.84,
        },
      ],
      recurringMistakes: [
        {
          id: "mistake_word_choice_translation_function",
          category: "word_choice",
          title: "直译式功能表达",
          occurrenceCount: 2,
          averageSeverity: 3,
          lastSeenAt: "2026-05-24T08:00:00.000Z",
          examples: [
            {
              reviewId: "review_1",
              sessionId: "session_1",
              original: "We have translation function.",
              correction: "real-time translated captions",
              explanationZh: "用具体产品能力替代直译式功能表达。",
            },
          ],
          recommendedDrill: "功能转客户价值表达练习",
        },
      ],
      naturalnessPatterns: [
        {
          id: "pattern_help_your_meeting",
          title: "help your meeting 不够自然",
          patternZh: "表达客户结果时容易直译 help your meeting。",
          betterExpression:
            "make multilingual customer meetings easier to follow",
          examples: [
            "We have translation function and it can help your meeting.",
          ],
        },
      ],
      phraseGrowth: {
        newPhraseCount: 3,
        reviewGeneratedPhraseCount: 2,
        vocabularyItems: [
          {
            term: "multilingual meetings",
            chinese: "多语言会议",
            example: "Rokid makes multilingual meetings easier to follow.",
            count: 2,
          },
        ],
        reusableSentences: [
          {
            english:
              "We can start with a focused pilot and involve your IT team early.",
            chinese:
              "我们可以先从聚焦试点开始，并尽早让 IT 团队参与。",
            useCase: "回应试点和隐私安全问题。",
          },
        ],
      },
      memoryInsights: [
        {
          id: "memory_feature_first",
          type: "reinforced_memory",
          title: "Feature-first answering pattern",
          summaryZh: "用户仍倾向先讲功能，再讲客户价值。",
          evidence: ["We have translation function."],
          action: "merge",
        },
      ],
      nextTrainingPlan: {
        title: "技术负责人 · 隐私与部署推进",
        reasonZh: "部署和隐私回答仍偏长，适合练习短回答和下一步推进。",
        goalId: "privacy_security",
        mode: "objection_challenge",
        personaId: "technical_lead",
        voicePackId: "charon-informative",
        materialMode: "memory_context",
        focusTags: ["隐私安全", "部署推进"],
        estimatedMinutes: 8,
      },
      aiGenerated: true,
    });

    expect(parsed.recurringMistakes[0]?.category).toBe("word_choice");
    expect(parsed.nextTrainingPlan.personaId).toBe("technical_lead");
  });

  it("rejects invalid analytics ranges", () => {
    expect(() =>
      reviewAnalyticsSnapshotSchema.parse({
        id: "review_analytics_future",
        range: "90d",
        generatedAt: "2026-05-24T09:00:00.000Z",
        staleAfter: "2026-05-24T23:59:59.999Z",
        sourceReviewIds: [],
        sourceSessionIds: [],
        trainingCount: 0,
        summaryZh: "No data.",
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
          title: "客户问答",
          reasonZh: "继续练习。",
          goalId: "customer_qa",
          mode: "customer_qa",
          personaId: "enterprise_buyer",
          voicePackId: "kore-firm",
          materialMode: "memory_context",
          focusTags: ["商业价值"],
          estimatedMinutes: 8,
        },
        aiGenerated: false,
      }),
    ).toThrow("长期复盘范围无效");
  });
});
