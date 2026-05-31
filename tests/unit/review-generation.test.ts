import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY: "DeepSeek text analysis boundary",
  generateTextJSON: generateTextJSONMock,
  hasTextAIApiKey: vi.fn(() => true),
}));

import { personas } from "@/data/personas";
import { generatePracticeReview } from "@/lib/ai/review";
import type { TranscriptTurnInput } from "@/lib/validation/practice";

const transcriptTurns = [
  {
    speaker: "ai_customer" as const,
    text: "What business problem are you trying to solve with smart glasses?",
    timestamp: 0,
    metadata: {},
  },
  {
    speaker: "user" as const,
    text: "We have translation function and it can help your meeting.",
    timestamp: 8,
    metadata: {},
  },
  {
    speaker: "ai_customer" as const,
    text: "How does this fit into our existing workflow?",
    timestamp: 16,
    metadata: {},
  },
  {
    speaker: "user" as const,
    text: "You can use it for pilot and review privacy later.",
    timestamp: 24,
    metadata: {},
  },
];

describe("generatePracticeReview", () => {
  beforeEach(() => {
    generateTextJSONMock.mockReset();
  });

  it("returns a validated structured review with scorecard, sentence upgrades, and learning assets", async () => {
    const review = await generatePracticeReview({
      practiceSession: {
        id: "session_123",
        scenarioPackId: "rokid-overseas-sales",
        goalId: "customer_qa",
        mode: "customer_qa",
        personaId: "technical_lead",
        voicePackId: "charon-informative",
        materialId: "material_123",
        prepCardId: "prep_123",
        difficulty: "normal",
        trainingFocus: ["business value", "privacy objection"],
        focusTags: ["商业价值", "隐私安全"],
        sourceObjectionId: undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      transcriptTurns,
      persona: personas.find((persona) => persona.id === "technical_lead")!,
      materialBrief: {
        keyMessage: "Rokid supports real-time translated captions.",
        productPoints: ["Real-time translated captions"],
        customerValue: ["Reduce communication friction"],
        likelyQuestions: ["How accurate is the translation?"],
        applicationScenarios: ["Overseas customer meetings"],
        pros: ["Hands-free captions"],
        cons: ["Needs IT review"],
        competitorDifferences: ["More meeting-focused than phone apps"],
        productParameters: ["Define pilot users and language pairs"],
        memoryStatus: "session_only",
        likelyObjections: ["How is meeting data handled?"],
        riskyClaims: ["Do not invent accuracy percentages."],
        usefulPhrases: ["May I first understand your use case?"],
        glossary: [],
        outline: ["Open with discovery."],
      },
      prepCard: {
        customerContext: "Technical lead in healthcare.",
        meetingGoal: "Qualify a pilot",
        keyTalkingPoints: ["Connect translation to workflow value."],
        discoveryQuestions: ["What does a successful pilot look like?"],
        likelyObjections: ["Privacy review"],
        openingScript: "May I first understand your use case?",
        mustUsePhrases: ["Reduce communication friction in real time."],
        doNotOverpromise: ["Do not invent pricing."],
      },
      mockMode: true,
    });

    expect(review.meetingOutcome.summary).toContain("Technical Lead");
    expect(review.scores.clarity.score).toBeGreaterThanOrEqual(1);
    expect(review.topImprovements).toHaveLength(3);
    expect(review.sentenceUpgrades[0]).toMatchObject({
      status: "needs_upgrade",
      original: expect.stringContaining("translation function"),
      naturalEnglish: expect.stringContaining("real-time translated captions"),
      chineseExplanation: expect.any(String),
      practicePrompt: expect.any(String),
    });
    expect(review.sentenceUpgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "already_natural",
          original: expect.stringContaining("practical next step"),
          positiveFeedback: expect.any(String),
          chineseExplanation: expect.any(String),
          practicePrompt: expect.any(String),
        }),
      ]),
    );
    expect(
      review.sentenceUpgrades.find(
        (upgrade) => upgrade.status === "already_natural",
      ),
    ).not.toHaveProperty("naturalEnglish");
    expect(review.reviewSnapshot).toMatchObject({
      overallSummaryZh: expect.any(String),
      nextPracticeFocus: expect.any(String),
    });
    expect(review.sentenceReviews[0]).toMatchObject({
      original: expect.stringContaining("translation function"),
      translationZh: expect.any(String),
      quality: "needs_improvement",
      grammarIssues: expect.any(Array),
      wordChoiceIssues: expect.any(Array),
      naturalnessIssues: expect.any(Array),
      highlights: expect.any(Array),
      vocabulary: expect.any(Array),
      phrasebookCandidate: expect.objectContaining({
        english: expect.any(String),
        chinese: expect.any(String),
      }),
    });
    expect(review.materialCoverage.covered).toContain("Real-time translated captions");
    expect(review.phrasebookSuggestions[0]).toMatchObject({
      source: "review",
      masteryStatus: "needs_practice",
    });
    expect(review.weaknessUpdates[0]).toMatchObject({
      type: expect.any(String),
      severity: expect.any(Number),
    });
    expect(review.memoryCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: expect.any(String),
          title: expect.any(String),
          summary: expect.any(String),
          evidence: expect.any(Array),
          sensitivity: expect.any(String),
          confidence: expect.any(Number),
          importance: expect.any(Number),
          enabledForAi: expect.any(Boolean),
        }),
      ]),
    );
    expect(review.nextSessionRecommendation.focus).toContain("business value");
  });

  it("generates conversationReview grounded in the transcript turns", async () => {
    const transcriptTurnsWithIds: Array<TranscriptTurnInput & { id: string }> = [
      {
        id: "turn_ai_1",
        speaker: "ai_customer",
        text: "Which customer scenario should we focus on first?",
        timestamp: 4,
        metadata: { translationZh: "我们应该先关注哪个客户场景？" },
      },
      {
        id: "turn_user_1",
        speaker: "user",
        text: "Rokid has translation function and smart glasses.",
        timestamp: 12,
        metadata: { translationZh: "Rokid 有翻译功能和智能眼镜。" },
      },
    ];

    const review = await generatePracticeReview({
      practiceSession: {
        id: "session_conversation_replay",
        scenarioPackId: "rokid-overseas-sales",
        goalId: "application_scenarios",
        mode: "customer_qa",
        personaId: "enterprise_buyer",
        voicePackId: "kore-firm",
        materialId: undefined,
        prepCardId: undefined,
        difficulty: "normal",
        trainingFocus: ["应用场景说明"],
        focusTags: ["应用场景"],
        sourceObjectionId: undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      transcriptTurns: transcriptTurnsWithIds,
      persona: personas.find((persona) => persona.id === "enterprise_buyer")!,
      mockMode: true,
    });

    expect(review.conversationReview?.turns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          turnId: "turn_ai_1",
          speaker: "ai_customer",
          intentZh: expect.stringContaining("客户"),
        }),
        expect.objectContaining({
          turnId: "turn_user_1",
          speaker: "user",
          answerFit: expect.any(String),
          betterResponse: expect.objectContaining({
            english: expect.any(String),
            chinese: expect.any(String),
            reasonZh: expect.any(String),
          }),
        }),
      ]),
    );
    expect(
      review.conversationReview?.overallFlow.nextConversationStrategyZh,
    ).toEqual(expect.any(String));
  });

  it("asks the text model to generate sentence reviews and validates the returned structure", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      meetingOutcome: {
        summary:
          "The learner explained the business value but needs a sharper pilot answer.",
        customerReaction: "Interested and asking for workflow proof.",
        nextStep: "Practice a shorter pilot answer.",
      },
      reviewSnapshot: {
        overallSummaryZh: "你能说明业务价值，但试点回答还可以更具体。",
        strengths: ["能把 Rokid 和会议效率连接起来"],
        priorityImprovements: ["少堆功能，多说客户结果"],
        phrasebookCandidateCount: 1,
        memoryCandidateCount: 1,
        nextPracticeFocus: "应用场景说明",
      },
      scores: {
        clarity: { score: 4, rationale: "Clear." },
        businessConfidence: { score: 3, rationale: "Needs stronger framing." },
        discoverySkill: { score: 3, rationale: "Needs more questions." },
        productPositioning: { score: 4, rationale: "Relevant." },
        objectionHandling: { score: 3, rationale: "Needs next step." },
        englishNaturalness: { score: 3, rationale: "Understandable." },
      },
      topImprovements: ["Lead with customer outcomes."],
      bestMoments: ["Connected Rokid to meeting flow."],
      conversationReview: {
        summaryZh: "本次对话能说明价值，但需要更明确确认客户场景。",
        turns: [
          {
            id: "conversation_turn_review_1",
            turnId: "turn_user_1",
            pairIndex: 1,
            speaker: "user",
            text: "We have translation function and it can help your meeting.",
            translationZh: "我们有翻译功能，可以帮助你们的会议。",
            timestamp: 8,
            intentZh: "用户试图说明产品价值。",
            roleInConversationZh: "用户回答客户问题",
            answerFit: "partial",
            answerFitReasonZh: "回答提到功能，但还需要连接客户具体场景。",
            strengths: ["有意识围绕会议场景回答"],
            issues: [
              {
                type: "answer_relevance",
                severity: 3,
                summaryZh: "回答还不够贴合客户具体问题。",
                evidence: "help your meeting",
                suggestionZh: "先确认客户场景，再说明实时字幕如何帮助该场景。",
              },
            ],
            betterResponse: {
              english:
                "For multilingual customer meetings, Rokid can make the conversation easier to follow with real-time translated captions.",
              chinese:
                "在多语言客户会议中，Rokid 可以通过实时翻译字幕让对话更容易跟上。",
              reasonZh: "这句话把功能连接到了客户场景和会议结果。",
            },
            relatedSentenceReviewIds: ["sentence_review_1"],
          },
        ],
        stages: [
          {
            stage: "value_positioning",
            labelZh: "介绍产品价值",
            status: "partial",
            evidenceTurnIds: ["turn_user_1"],
            summaryZh: "已经说明产品能力，但业务价值还可以更具体。",
            improvementZh: "用客户场景承接产品功能。",
          },
        ],
        overallFlow: {
          answeredCustomerNeedsZh: ["说明了实时翻译字幕的价值"],
          missedCustomerNeedsZh: ["没有先确认客户具体工作流"],
          strongestMomentZh: "能把产品连接到会议场景。",
          weakestMomentZh: "客户场景确认不足。",
          nextConversationStrategyZh: "先确认场景，再给产品价值。",
        },
      },
      sentenceReviews: [
        {
          id: "sentence_review_1",
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
              explanationZh: "用产品价值表达替代直译式功能表达。",
            },
          ],
          naturalnessIssues: [
            {
              type: "naturalness",
              severity: 3,
              originalFragment: "help your meeting",
              correction: "make multilingual meetings easier to follow",
              explanationZh: "更贴合商务会议语境。",
            },
          ],
          highlights: [
            {
              type: "customer_empathy",
              text: "meeting",
              explanationZh: "有意识围绕客户会议场景回答。",
              alternatives: ["meeting flow"],
            },
          ],
          upgradedExpression:
            "Rokid makes multilingual meetings easier to follow with real-time translated captions.",
          upgradedExpressionZh:
            "Rokid 通过实时翻译字幕让多语言会议更容易跟上。",
          reasonZh: "改写后从功能转向客户结果，更自然也更商务。",
          practicePrompt: "用这句话重新回答客户关于会议场景的问题。",
          vocabulary: [
            {
              term: "multilingual meetings",
              phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈmiːtɪŋz/",
              chinese: "多语言会议",
              example: "Rokid makes multilingual meetings easier to follow.",
              sourceSentence:
                "We have translation function and it can help your meeting.",
            },
          ],
          phrasebookCandidate: {
            english:
              "Rokid makes multilingual meetings easier to follow with real-time translated captions.",
            chinese: "Rokid 通过实时翻译字幕让多语言会议更容易跟上。",
            useCase: "说明 Rokid 在多语言会议中的价值。",
            tags: ["review", "sentence-review"],
          },
        },
      ],
      sentenceUpgrades: [],
      materialCoverage: { covered: [], missed: [], unclear: [] },
      phrasebookSuggestions: [],
      weaknessUpdates: [],
      memoryCandidates: [
        {
          type: "speaking_pattern",
          title: "Feature-first answering pattern",
          summary: "Learner tends to explain function before customer value.",
          evidence: ["translation function"],
          sensitivity: "low",
          confidence: 0.8,
          importance: 4,
          enabledForAi: true,
        },
      ],
      nextSessionRecommendation: {
        focus: "应用场景说明",
        drill: "Feature-to-value drill",
        prompt: "Explain the meeting scenario in two sentences.",
      },
    });

    const review = await generatePracticeReview({
      practiceSession: {
        id: "session_456",
        scenarioPackId: "rokid-overseas-sales",
        goalId: "application_scenarios",
        mode: "demo_narration",
        personaId: "enterprise_buyer",
        voicePackId: "kore-firm",
        materialId: undefined,
        prepCardId: undefined,
        difficulty: "normal",
        trainingFocus: ["应用场景说明"],
        focusTags: ["应用场景说明"],
        sourceObjectionId: undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      transcriptTurns,
      persona: personas.find((persona) => persona.id === "enterprise_buyer")!,
      mockMode: false,
    });

    expect(generateTextJSONMock).toHaveBeenCalledTimes(1);
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("sentenceReviews");
    expect(prompt).toContain("grammarIssues");
    expect(prompt).toContain("wordChoiceIssues");
    expect(prompt).toContain("naturalnessIssues");
    expect(prompt).toContain("highlights");
    expect(prompt).toContain("conversationReview");
    expect(prompt).toContain("conversationReview.turns");
    expect(prompt).toContain("answerFit");
    expect(prompt).toContain("Do not rewrite sentences that are already natural");
    expect(review.conversationReview?.turns[0]?.answerFit).toBe("partial");
    expect(review.sentenceReviews[0]?.phrasebookCandidate?.english).toContain(
      "Rokid makes multilingual meetings",
    );
  });
});
