import { describe, expect, it } from "vitest";

import { createMaterialInputSchema } from "@/lib/validation/materials";
import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import { createPracticeSessionInputSchema } from "@/lib/validation/practice";
import { createReviewInputSchema } from "@/lib/validation/reviews";

describe("api validation schemas", () => {
  it("accepts valid material input", () => {
    expect(
      createMaterialInputSchema.parse({
        name: "Rokid enterprise demo deck",
        fileType: "PDF",
        originalFileName: "demo.pdf",
        storagePath: "materials/demo.pdf",
        customerType: "Enterprise Buyer",
        industry: "Conference",
        meetingGoal: "schedule_follow_up_demo",
        confidentialMode: true,
        notes: "Practice privacy objections.",
      }),
    ).toMatchObject({
      fileType: "PDF",
      confidentialMode: true,
    });
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      createMaterialInputSchema.parse({
        name: "Video demo",
        fileType: "MP4",
        originalFileName: "demo.mp4",
        storagePath: "materials/demo.mp4",
      }),
    ).toThrow("不支持该文件类型");
  });

  it("rejects invalid persona ids", () => {
    expect(() =>
      createPracticeSessionInputSchema.parse({
        mode: "customer_qa",
        personaId: "random_customer",
        difficulty: "normal",
        trainingFocus: ["business_value"],
      }),
    ).toThrow("客户角色无效");
  });

  it("rejects empty phrase English sentences", () => {
    expect(() =>
      createPhraseInputSchema.parse({
        category: "Business Value",
        english: "   ",
        chinese: "核心价值是实时降低沟通阻力。",
        useCase: "Explaining business value.",
        tags: ["business-value"],
      }),
    ).toThrow("英文句子不能为空");
  });

  it("accepts sentence-level review details for grammar, vocabulary, naturalness, and highlights", () => {
    const parsed = createReviewInputSchema.parse({
      meetingOutcome: {
        summary: "The learner communicated the value but needs shorter answers.",
        customerReaction: "Interested but cautious.",
        nextStep: "Practice a shorter security response.",
      },
      reviewSnapshot: {
        overallSummaryZh:
          "你能说明 Rokid 的会议价值，但安全问题回答偏长。",
        strengths: ["能连接跨语言会议场景", "使用了 workflow fit"],
        priorityImprovements: ["安全问题回答更短", "减少功能堆砌"],
        phrasebookCandidateCount: 1,
        memoryCandidateCount: 1,
        nextPracticeFocus: "隐私安全沟通",
      },
      scores: {
        clarity: { score: 4, rationale: "Clear enough." },
        businessConfidence: {
          score: 3,
          rationale: "Needs stronger value framing.",
        },
        discoverySkill: { score: 3, rationale: "Needs more questions." },
        productPositioning: { score: 4, rationale: "Relevant positioning." },
        objectionHandling: { score: 3, rationale: "Needs boundary setting." },
        englishNaturalness: {
          score: 3,
          rationale: "Understandable but improvable.",
        },
      },
      topImprovements: ["Shorten security answers"],
      bestMoments: ["Used workflow fit naturally"],
      sentenceReviews: [
        {
          id: "sentence_review_1",
          original: "We can help your meeting more smooth.",
          translationZh: "我们可以让你们的会议更顺畅。",
          quality: "needs_improvement",
          grammarIssues: [
            {
              type: "grammar",
              severity: 3,
              originalFragment: "more smooth",
              correction: "smoother",
              explanationZh: "形容词 smooth 的比较级应使用 smoother。",
            },
          ],
          wordChoiceIssues: [
            {
              type: "word_choice",
              severity: 2,
              originalFragment: "help your meeting",
              correction: "make your meetings",
              explanationZh: "make your meetings smoother 更符合英文表达习惯。",
            },
          ],
          naturalnessIssues: [
            {
              type: "naturalness",
              severity: 3,
              originalFragment: "help your meeting more smooth",
              correction: "make your multilingual meetings smoother",
              explanationZh: "表达更自然，也更贴合商务会议场景。",
            },
          ],
          highlights: [
            {
              type: "customer_empathy",
              text: "meeting",
              explanationZh: "能围绕客户会议场景表达价值。",
              alternatives: ["workflow", "meeting flow"],
            },
          ],
          upgradedExpression:
            "Rokid can make your multilingual meetings smoother and easier to follow.",
          upgradedExpressionZh:
            "Rokid 可以让你们的多语言会议更顺畅、更容易跟上。",
          reasonZh: "改写后更自然，也更清楚表达客户价值。",
          practicePrompt: "用这句话重新回答一次客户关于会议场景的问题。",
          vocabulary: [
            {
              term: "multilingual meetings",
              phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈmiːtɪŋz/",
              chinese: "多语言会议",
              example: "Rokid supports multilingual meetings.",
              sourceSentence: "We can help your meeting more smooth.",
            },
          ],
          phrasebookCandidate: {
            english:
              "Rokid can make your multilingual meetings smoother and easier to follow.",
            chinese: "Rokid 可以让你们的多语言会议更顺畅、更容易跟上。",
            useCase: "说明 Rokid 对跨语言会议的价值。",
            tags: ["review", "sentence-review", "business-value"],
          },
        },
      ],
      materialCoverage: { covered: [], missed: [], unclear: [] },
      phrasebookSuggestions: [],
      weaknessUpdates: [
        {
          type: "grammar_accuracy",
          severity: 3,
          evidence: "The learner said more smooth instead of smoother.",
          recommendedDrill: "比较级和商务表达精修",
        },
      ],
      memoryCandidates: [
        {
          type: "recurring_error",
          title: "Comparative adjective issue",
          summary: "The learner may confuse comparative adjective forms.",
          evidence: ["more smooth -> smoother"],
          sensitivity: "low",
          confidence: 0.82,
          importance: 3,
          enabledForAi: true,
        },
      ],
      nextSessionRecommendation: {
        focus: "隐私安全沟通",
        drill: "Short security answer drill",
        prompt: "Answer a security question in two sentences.",
      },
    });

    expect(parsed.sentenceReviews[0]?.grammarIssues[0]?.correction).toBe(
      "smoother",
    );
    expect(parsed.reviewSnapshot?.nextPracticeFocus).toBe("隐私安全沟通");
  });
});
