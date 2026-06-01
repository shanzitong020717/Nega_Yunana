# 单次练习复盘第一阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first phase of the review system: 30 秒复盘结论、逐句精修、语法/用词/自然度问题、亮点表达、表达库候选、记忆候选和弱项更新。

**Architecture:** Extend the current review JSON contract instead of replacing it. Add `reviewSnapshot` and `sentenceReviews` to validation, generation, mock data, UI rendering, and tests while keeping `sentenceUpgrades` as backward-compatible data.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Vitest, Testing Library, existing DeepSeek text-analysis wrapper, existing in-memory review/memory/weakness stores.

---

## File Map

- Modify `src/lib/validation/reviews.ts`: add schemas and types for `reviewSnapshot`, `sentenceReviews`, richer memory candidates, and phrasebook-compatible candidates.
- Modify `src/lib/ai/review.ts`: update mock review and DeepSeek prompt to generate the new fields.
- Create `src/features/reviews/sentence-review-panel.tsx`: render sentence-level grammar, word choice, naturalness, highlights, upgraded expressions, vocabulary, and save-to-phrasebook action.
- Modify `src/features/reviews/review-summary-card.tsx`: prefer `review.reviewSnapshot` and fall back to existing fields.
- Modify `src/features/reviews/review-view.tsx`: place `SentenceReviewPanel` immediately after the summary card and before old table sections.
- Modify `src/features/reviews/memory-candidates.tsx`: render richer evidence/importance fields when present.
- Create `tests/unit/review-generation.test.ts`: verify AI prompt and mock payload structure.
- Modify `tests/unit/review-view.test.tsx`: verify new first-phase review UI.
- Modify `tests/unit/api-validation.test.ts`: verify validation accepts complete sentence review data and rejects malformed issue records.

## Task 1: Extend Review Validation Contract

**Files:**
- Modify: `src/lib/validation/reviews.ts`
- Test: `tests/unit/api-validation.test.ts`

- [ ] **Step 1: Write the failing validation test**

Add this test to `tests/unit/api-validation.test.ts`:

```ts
import { createReviewInputSchema } from "@/lib/validation/reviews";

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
      businessConfidence: { score: 3, rationale: "Needs stronger value framing." },
      discoverySkill: { score: 3, rationale: "Needs more questions." },
      productPositioning: { score: 4, rationale: "Relevant positioning." },
      objectionHandling: { score: 3, rationale: "Needs boundary setting." },
      englishNaturalness: { score: 3, rationale: "Understandable but improvable." },
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/api-validation.test.ts
```

Expected: FAIL because `reviewSnapshot`, `sentenceReviews`, and richer `memoryCandidates` are not in `createReviewInputSchema`.

- [ ] **Step 3: Add Zod schemas**

In `src/lib/validation/reviews.ts`, add:

```ts
const sentenceIssueSchema = z.object({
  type: z.enum([
    "grammar",
    "word_choice",
    "naturalness",
    "conciseness",
    "business_tone",
    "logic",
  ]),
  severity: z.number().int().min(1).max(5),
  originalFragment: nonEmptyString("原片段不能为空"),
  correction: nonEmptyString("修正表达不能为空"),
  explanationZh: nonEmptyString("中文解释不能为空"),
});

const sentenceHighlightSchema = z.object({
  type: z.enum([
    "advanced_word",
    "business_tone",
    "good_structure",
    "synonym_usage",
    "clear_next_step",
    "customer_empathy",
  ]),
  text: nonEmptyString("亮点文本不能为空"),
  explanationZh: nonEmptyString("亮点解释不能为空"),
  alternatives: z.array(z.string().min(1)).default([]).optional(),
});

const reviewVocabularyItemSchema = z.object({
  term: nonEmptyString("词汇不能为空"),
  phonetic: z.string().optional(),
  chinese: nonEmptyString("中文翻译不能为空"),
  example: nonEmptyString("例句不能为空"),
  sourceSentence: nonEmptyString("来源句子不能为空"),
});

const sentenceReviewSchema = z.object({
  id: nonEmptyString("逐句复盘 ID 不能为空"),
  turnId: z.string().optional(),
  original: nonEmptyString("原句不能为空"),
  translationZh: nonEmptyString("中文意思不能为空"),
  quality: z.enum(["excellent", "good", "needs_improvement"]),
  grammarIssues: z.array(sentenceIssueSchema).default([]),
  wordChoiceIssues: z.array(sentenceIssueSchema).default([]),
  naturalnessIssues: z.array(sentenceIssueSchema).default([]),
  highlights: z.array(sentenceHighlightSchema).default([]),
  upgradedExpression: z.string().optional(),
  upgradedExpressionZh: z.string().optional(),
  reasonZh: nonEmptyString("复盘原因不能为空"),
  practicePrompt: nonEmptyString("练习提示不能为空"),
  vocabulary: z.array(reviewVocabularyItemSchema).default([]),
  phrasebookCandidate: z
    .object({
      english: nonEmptyString("表达英文不能为空"),
      chinese: nonEmptyString("表达中文不能为空"),
      useCase: nonEmptyString("使用场景不能为空"),
      tags: z.array(z.string().min(1)).default([]),
    })
    .optional(),
});

const reviewSnapshotSchema = z.object({
  overallSummaryZh: nonEmptyString("复盘总评不能为空"),
  strengths: z.array(nonEmptyString("亮点不能为空")).min(1).max(3),
  priorityImprovements: z.array(nonEmptyString("改进点不能为空")).min(1).max(3),
  phrasebookCandidateCount: z.number().int().min(0),
  memoryCandidateCount: z.number().int().min(0),
  nextPracticeFocus: nonEmptyString("下次练习重点不能为空"),
});
```

Replace `memoryCandidateSchema` with a backward-compatible schema:

```ts
export const memoryCandidateSchema = z.object({
  type: nonEmptyString("记忆类型不能为空"),
  title: nonEmptyString("记忆标题不能为空"),
  summary: nonEmptyString("记忆摘要不能为空"),
  evidence: z.array(z.string().min(1)).default([]),
  sensitivity: z.enum(["low", "medium", "high"], {
    error: "敏感度无效",
  }),
  confidence: z.number().min(0).max(1),
  importance: z.number().int().min(1).max(5).default(3),
  enabledForAi: z.boolean().default(true),
});
```

Extend `createReviewInputSchema`:

```ts
reviewSnapshot: reviewSnapshotSchema.optional(),
sentenceReviews: z.array(sentenceReviewSchema).default([]),
```

Export types:

```ts
export type SentenceReview = z.infer<typeof sentenceReviewSchema>;
export type SentenceIssue = z.infer<typeof sentenceIssueSchema>;
export type SentenceHighlight = z.infer<typeof sentenceHighlightSchema>;
export type ReviewSnapshot = z.infer<typeof reviewSnapshotSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- tests/unit/api-validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/reviews.ts tests/unit/api-validation.test.ts
git commit -m "feat: add sentence-level review schema"
```

## Task 2: Generate Sentence Reviews in AI Review

**Files:**
- Modify: `src/lib/ai/review.ts`
- Test: create `tests/unit/review-generation.test.ts`

- [ ] **Step 1: Write failing generation tests**

Create `tests/unit/review-generation.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY:
    "DeepSeek text analysis boundary: Use DeepSeek only for offline JSON text analysis.",
  generateTextJSON: generateTextJSONMock,
  hasTextAIApiKey: () => true,
}));

import { generatePracticeReview } from "@/lib/ai/review";

const practiceSession = {
  id: "session_review_phase1",
  scenarioPackId: "rokid-overseas-sales",
  goalId: "application_scenarios",
  mode: "customer_qa",
  personaId: "enterprise_buyer",
  voicePackId: "kore-firm",
  materialMode: "memory_context",
  materialId: null,
  prepCardId: null,
  difficulty: "normal",
  trainingFocus: ["应用场景说明"],
  focusTags: ["应用场景说明"],
  sourceObjectionId: undefined,
  status: "completed",
  createdAt: "2026-05-24T00:00:00.000Z",
  updatedAt: "2026-05-24T00:00:00.000Z",
};

const persona = {
  id: "enterprise_buyer",
  name: "Enterprise Buyer",
  focusAreas: ["ROI", "pilot value", "business outcomes"],
  tone: "Cautious and outcome-oriented.",
  sampleQuestions: ["What would a successful pilot look like?"],
};

describe("practice review generation phase 1", () => {
  afterEach(() => {
    generateTextJSONMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("asks DeepSeek for sentence reviews, highlights, memory candidates, and phrasebook candidates", async () => {
    vi.stubEnv("AI_MOCK_MODE", "false");
    generateTextJSONMock.mockResolvedValueOnce({
      meetingOutcome: {
        summary: "The learner explained the value but needs grammar cleanup.",
        customerReaction: "Interested.",
        nextStep: "Practice shorter answers.",
      },
      reviewSnapshot: {
        overallSummaryZh: "表达能被理解，但需要修正语法和商务自然度。",
        strengths: ["能围绕会议场景回答"],
        priorityImprovements: ["修正 more smooth 这类比较级错误"],
        phrasebookCandidateCount: 1,
        memoryCandidateCount: 1,
        nextPracticeFocus: "语法准确性",
      },
      scores: {
        clarity: { score: 3, rationale: "Understandable." },
        businessConfidence: { score: 3, rationale: "Needs stronger wording." },
        discoverySkill: { score: 3, rationale: "Needs discovery." },
        productPositioning: { score: 3, rationale: "Relevant." },
        objectionHandling: { score: 3, rationale: "Basic." },
        englishNaturalness: { score: 2, rationale: "Grammar issue." },
      },
      topImprovements: ["Improve comparative adjectives"],
      bestMoments: ["Customer scenario was clear"],
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
              explanationZh: "比较级应为 smoother。",
            },
          ],
          wordChoiceIssues: [],
          naturalnessIssues: [],
          highlights: [
            {
              type: "customer_empathy",
              text: "meeting",
              explanationZh: "能围绕客户会议场景表达。",
            },
          ],
          upgradedExpression:
            "Rokid can make your multilingual meetings smoother.",
          upgradedExpressionZh: "Rokid 可以让多语言会议更顺畅。",
          reasonZh: "更自然且更准确。",
          practicePrompt: "重新说一遍这句话。",
          vocabulary: [],
          phrasebookCandidate: {
            english: "Rokid can make your multilingual meetings smoother.",
            chinese: "Rokid 可以让多语言会议更顺畅。",
            useCase: "说明会议场景价值。",
            tags: ["review", "sentence-review"],
          },
        },
      ],
      materialCoverage: { covered: [], missed: [], unclear: [] },
      phrasebookSuggestions: [],
      weaknessUpdates: [
        {
          type: "grammar_accuracy",
          severity: 3,
          evidence: "more smooth should be smoother",
          recommendedDrill: "Comparative adjective drill",
        },
      ],
      memoryCandidates: [
        {
          type: "recurring_error",
          title: "Comparative adjective issue",
          summary: "The learner may say more smooth instead of smoother.",
          evidence: ["more smooth"],
          sensitivity: "low",
          confidence: 0.8,
          importance: 3,
          enabledForAi: true,
        },
      ],
      nextSessionRecommendation: {
        focus: "语法准确性",
        drill: "Comparative adjective drill",
        prompt: "Use smoother in a business sentence.",
      },
    });

    const review = await generatePracticeReview({
      practiceSession,
      transcriptTurns: [
        {
          speaker: "user",
          text: "We can help your meeting more smooth.",
          timestamp: 1000,
        },
      ],
      persona,
    });

    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;

    expect(prompt).toContain("sentenceReviews");
    expect(prompt).toContain("grammarIssues");
    expect(prompt).toContain("wordChoiceIssues");
    expect(prompt).toContain("naturalnessIssues");
    expect(prompt).toContain("highlights");
    expect(prompt).toContain("Do not rewrite sentences that are already natural");
    expect(review.sentenceReviews[0]?.grammarIssues[0]?.correction).toBe(
      "smoother",
    );
  });

  it("mock review includes sentenceReviews so development mirrors production", async () => {
    vi.stubEnv("AI_MOCK_MODE", "true");

    const review = await generatePracticeReview({
      practiceSession,
      transcriptTurns: [
        {
          speaker: "user",
          text: "We can help your meeting more smooth.",
          timestamp: 1000,
        },
      ],
      persona,
    });

    expect(review.reviewSnapshot?.overallSummaryZh).toContain("复盘");
    expect(review.sentenceReviews.length).toBeGreaterThan(0);
    expect(review.sentenceReviews[0]?.original).toBe(
      "We can help your meeting more smooth.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-generation.test.ts
```

Expected: FAIL because prompt and mock review do not produce `sentenceReviews`.

- [ ] **Step 3: Update mock review**

In `src/lib/ai/review.ts`, update `generateMockReview()` payload with:

```ts
reviewSnapshot: {
  overallSummaryZh:
    "本次复盘：你能说明 Rokid 的客户价值，但部分表达还需要更自然、更精炼。",
  strengths: [
    `能把回答连接到 ${customerValue}`,
    "没有编造价格、认证或不确定的产品承诺",
  ],
  priorityImprovements: [
    "把功能描述升级成客户业务结果",
    "回答安全和部署问题时更短、更有边界感",
  ],
  phrasebookCandidateCount: 1 + suggestedAnswerPhrases.length,
  memoryCandidateCount: 2,
  nextPracticeFocus: focus,
},
sentenceReviews: [
  {
    id: "sentence_review_mock_1",
    original: userSentence,
    translationZh: "用户正在说明 Rokid 的会议沟通价值。",
    quality: "needs_improvement",
    grammarIssues: [],
    wordChoiceIssues: [
      {
        type: "word_choice",
        severity: 2,
        originalFragment: "help",
        correction: "support / make / enable",
        explanationZh:
          "商务表达中可以用 support、make、enable 更清楚地连接客户结果。",
      },
    ],
    naturalnessIssues: [
      {
        type: "naturalness",
        severity: 3,
        originalFragment: userSentence,
        correction: `Rokid supports ${productPoint.toLowerCase()}, helping users follow multilingual conversations more smoothly during customer meetings.`,
        explanationZh:
          "升级后不只说明功能，还说明它如何帮助客户在真实会议中沟通。",
      },
    ],
    highlights: [
      {
        type: "customer_empathy",
        text: customerValue,
        explanationZh: "能围绕客户会议场景说明价值，这是商务会谈中的好方向。",
        alternatives: ["workflow value", "meeting flow", "communication friction"],
      },
    ],
    upgradedExpression: `Rokid supports ${productPoint.toLowerCase()}, helping users follow multilingual conversations more smoothly during customer meetings.`,
    upgradedExpressionZh:
      "Rokid 支持实时翻译字幕，帮助用户在客户会议中更顺畅地跟上多语言对话。",
    reasonZh:
      "这句话把产品功能转成了客户可理解的会议价值，比单纯说功能更商务。",
    practicePrompt:
      "用这句话重新说明 Rokid 的会议价值，然后补一个客户场景。",
    vocabulary: [
      {
        term: "communication friction",
        phonetic: "/kəˌmjuːnɪˈkeɪʃən ˈfrɪkʃən/",
        chinese: "沟通阻力",
        example: "Rokid reduces communication friction in multilingual meetings.",
        sourceSentence: userSentence,
      },
      {
        term: "multilingual conversations",
        phonetic: "/ˌmʌltiˈlɪŋɡwəl ˌkɑːnvərˈseɪʃənz/",
        chinese: "多语言对话",
        example: "Users can follow multilingual conversations more smoothly.",
        sourceSentence: userSentence,
      },
    ],
    phrasebookCandidate: {
      english: `Rokid supports ${productPoint.toLowerCase()}, helping users follow multilingual conversations more smoothly during customer meetings.`,
      chinese:
        "Rokid 支持实时翻译字幕，帮助用户在客户会议中更顺畅地跟上多语言对话。",
      useCase: "说明 Rokid 在跨语言客户会议中的价值。",
      tags: ["review", "sentence-review", "business-value"],
    },
  },
],
```

- [ ] **Step 4: Update review prompt**

In `buildReviewPrompt()`, replace the sentence review instructions with:

```ts
"The JSON must include reviewSnapshot, sentenceReviews, meetingOutcome, scores, topImprovements, bestMoments, materialCoverage, phrasebookSuggestions, weaknessUpdates, memoryCandidates, and nextSessionRecommendation.",
"For sentenceReviews, analyze only user turns. Every meaningful user English sentence must have one sentenceReview item.",
"Each sentenceReview must include original, translationZh, quality, grammarIssues, wordChoiceIssues, naturalnessIssues, highlights, reasonZh, practicePrompt, vocabulary, and optional phrasebookCandidate.",
"grammarIssues must capture grammar mistakes. wordChoiceIssues must capture inaccurate or weak word choices. naturalnessIssues must capture Chinglish, verbosity, weak business tone, or unclear logic.",
"highlights must praise strong wording, advanced words, synonym usage, business tone, clear structure, customer empathy, or strong next-step framing.",
"Do not rewrite sentences that are already natural. For excellent or good sentences, leave upgradedExpression empty unless a small business polish is genuinely useful, and explain what the learner did well.",
"When rewriting, make upgradedExpression more natural, concise, and appropriate for the selected customer role and business context.",
"Generate at least one phrasebookCandidate when a sentence or upgraded expression is reusable in business conversation.",
"Generate memoryCandidates from durable patterns only: recurring errors, speaking habits, strengths, learning preferences, or next practice focus.",
```

- [ ] **Step 5: Run generation tests**

Run:

```bash
npm test -- tests/unit/review-generation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/review.ts tests/unit/review-generation.test.ts
git commit -m "feat: generate sentence-level practice reviews"
```

## Task 3: Build Sentence Review UI

**Files:**
- Create: `src/features/reviews/sentence-review-panel.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing UI test**

In `tests/unit/review-view.test.tsx`, extend the mock `review` with one `reviewSnapshot` and one `sentenceReviews` item. Add:

```ts
it("renders sentence-level review details for errors, highlights, and upgraded expressions", () => {
  render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

  expect(screen.getByText("逐句精修")).toBeInTheDocument();
  expect(screen.getByText("We can help your meeting more smooth.")).toBeInTheDocument();
  expect(screen.getByText("语法错误")).toBeInTheDocument();
  expect(screen.getByText("more smooth")).toBeInTheDocument();
  expect(screen.getByText("smoother")).toBeInTheDocument();
  expect(screen.getByText("说得好的地方")).toBeInTheDocument();
  expect(screen.getByText("meeting")).toBeInTheDocument();
  expect(
    screen.getByText("Rokid can make your multilingual meetings smoother."),
  ).toBeInTheDocument();
  expect(screen.getByText("multilingual meetings")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL because `SentenceReviewPanel` does not exist and `ReviewView` does not render sentenceReviews.

- [ ] **Step 3: Create `SentenceReviewPanel`**

Create `src/features/reviews/sentence-review-panel.tsx`:

```tsx
"use client";

import { BookmarkPlus, CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type SentenceReview = PracticeReviewPayload["sentenceReviews"][number];
type SaveState = "idle" | "saving" | "saved" | "error";

const qualityLabel = {
  excellent: "优秀",
  good: "良好",
  needs_improvement: "需要改进",
} satisfies Record<SentenceReview["quality"], string>;

function issueKey(issue: SentenceReview["grammarIssues"][number]) {
  return `${issue.type}-${issue.originalFragment}-${issue.correction}`;
}

function IssueList({
  title,
  issues,
}: {
  title: string;
  issues: SentenceReview["grammarIssues"];
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {issues.map((issue) => (
          <div key={issueKey(issue)} className="text-sm leading-6">
            <p className="font-medium text-[var(--foreground)]">
              {issue.originalFragment} → {issue.correction}
            </p>
            <p className="text-[var(--muted)]">{issue.explanationZh}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SentenceReviewPanel({
  sentenceReviews,
}: {
  sentenceReviews: PracticeReviewPayload["sentenceReviews"];
}) {
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  if (sentenceReviews.length === 0) {
    return null;
  }

  async function savePhrase(sentenceReview: SentenceReview) {
    if (!sentenceReview.phrasebookCandidate) {
      return;
    }

    setSaveStates((current) => ({
      ...current,
      [sentenceReview.id]: "saving",
    }));

    try {
      const response = await fetch("/api/phrasebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "Business Value",
          english: sentenceReview.phrasebookCandidate.english,
          chinese: sentenceReview.phrasebookCandidate.chinese,
          useCase: sentenceReview.phrasebookCandidate.useCase,
          simpleVersion: sentenceReview.original,
          professionalVersion:
            sentenceReview.upgradedExpression ??
            sentenceReview.phrasebookCandidate.english,
          tags: sentenceReview.phrasebookCandidate.tags,
          source: "review",
          masteryStatus: "needs_practice",
        }),
      });

      if (!response.ok) {
        throw new Error("保存表达失败");
      }

      setSaveStates((current) => ({
        ...current,
        [sentenceReview.id]: "saved",
      }));
    } catch {
      setSaveStates((current) => ({
        ...current,
        [sentenceReview.id]: "error",
      }));
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <WandSparkles className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">逐句精修</h2>
      </div>
      <div className="mt-4 space-y-4">
        {sentenceReviews.map((sentenceReview) => {
          const saveState = saveStates[sentenceReview.id] ?? "idle";

          return (
            <article
              key={sentenceReview.id}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusPill
                    tone={
                      sentenceReview.quality === "needs_improvement"
                        ? "warning"
                        : "primary"
                    }
                  >
                    {qualityLabel[sentenceReview.quality]}
                  </StatusPill>
                  <p className="mt-3 text-base font-semibold">
                    {sentenceReview.original}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {sentenceReview.translationZh}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <IssueList title="语法错误" issues={sentenceReview.grammarIssues} />
                <IssueList title="用词问题" issues={sentenceReview.wordChoiceIssues} />
                <IssueList title="不自然表达" issues={sentenceReview.naturalnessIssues} />
              </div>

              {sentenceReview.highlights.length > 0 ? (
                <div className="mt-4 rounded-md border border-[#b9dfd9] bg-[#f4fbfa] p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                    <p className="text-sm font-semibold">说得好的地方</p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {sentenceReview.highlights.map((highlight) => (
                      <div key={`${highlight.type}-${highlight.text}`} className="text-sm leading-6">
                        <p className="font-medium">{highlight.text}</p>
                        <p className="text-[var(--muted)]">{highlight.explanationZh}</p>
                        {highlight.alternatives?.length ? (
                          <p className="text-[var(--primary)]">
                            可替换：{highlight.alternatives.join(" / ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {sentenceReview.upgradedExpression ? (
                <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3">
                  <p className="text-sm font-semibold">更自然表达</p>
                  <p className="mt-2 text-base font-semibold">
                    {sentenceReview.upgradedExpression}
                  </p>
                  {sentenceReview.upgradedExpressionZh ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {sentenceReview.upgradedExpressionZh}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {sentenceReview.reasonZh}
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex gap-2 rounded-md border border-[#b9dfd9] bg-white p-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
                  <p>{sentenceReview.reasonZh}</p>
                </div>
              )}

              {sentenceReview.vocabulary.length > 0 ? (
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {sentenceReview.vocabulary.map((item) => (
                    <div key={`${sentenceReview.id}-${item.term}`} className="rounded-md border border-[var(--border)] bg-white p-3 text-sm">
                      <p className="font-semibold">{item.term}</p>
                      {item.phonetic ? (
                        <p className="mt-1 text-[var(--primary)]">{item.phonetic}</p>
                      ) : null}
                      <p className="mt-1 text-[var(--muted)]">{item.chinese}</p>
                      <p className="mt-2 text-[var(--muted)]">{item.example}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {sentenceReview.phrasebookCandidate ? (
                <button
                  type="button"
                  disabled={saveState === "saving" || saveState === "saved"}
                  onClick={() => {
                    void savePhrase(sentenceReview);
                  }}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]"
                >
                  <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                  {saveState === "saving"
                    ? "保存中..."
                    : saveState === "saved"
                      ? "已保存"
                      : saveState === "error"
                        ? "重试保存"
                        : "保存到表达库"}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render panel in `ReviewView`**

Import:

```ts
import { SentenceReviewPanel } from "@/features/reviews/sentence-review-panel";
```

Render immediately after `<ReviewSummaryCard review={review} />`:

```tsx
<SentenceReviewPanel sentenceReviews={review.sentenceReviews} />
```

- [ ] **Step 5: Run UI test**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/reviews/sentence-review-panel.tsx src/features/reviews/review-view.tsx tests/unit/review-view.test.tsx
git commit -m "feat: render sentence-level review panel"
```

## Task 4: Upgrade 30 秒复盘结论

**Files:**
- Modify: `src/features/reviews/review-summary-card.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing summary test**

Add:

```ts
it("renders the review snapshot as the 30-second review conclusion", () => {
  render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

  expect(screen.getByText("30秒复盘结论")).toBeInTheDocument();
  expect(screen.getByText("你能说明 Rokid 的会议价值，但安全问题回答偏长。")).toBeInTheDocument();
  expect(screen.getByText("能连接跨语言会议场景")).toBeInTheDocument();
  expect(screen.getByText("安全问题回答更短")).toBeInTheDocument();
  expect(screen.getByText("隐私安全沟通")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL because `ReviewSummaryCard` does not read `reviewSnapshot`.

- [ ] **Step 3: Update `ReviewSummaryCard`**

Use:

```tsx
const snapshot = review.reviewSnapshot;
const bestItems = snapshot?.strengths ?? review.bestMoments.slice(0, 3);
const improvementItems =
  snapshot?.priorityImprovements ?? review.topImprovements.slice(0, 3);
const nextFocus =
  snapshot?.nextPracticeFocus ?? review.nextSessionRecommendation.focus;
```

Render these labels:

- `本次总评`
- `说得好的地方`
- `最需要改`
- `下一次重点`

If `snapshot` exists, show `snapshot.overallSummaryZh`; otherwise keep current fallback.

- [ ] **Step 4: Run summary test**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/reviews/review-summary-card.tsx tests/unit/review-view.test.tsx
git commit -m "feat: show review snapshot summary"
```

## Task 5: Render Rich Memory Candidates

**Files:**
- Modify: `src/features/reviews/memory-candidates.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing memory candidate test**

Add:

```ts
it("renders evidence and importance for long-term memory candidates", () => {
  render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

  expect(screen.getByText("Comparative adjective issue")).toBeInTheDocument();
  expect(screen.getByText("more smooth -> smoother")).toBeInTheDocument();
  expect(screen.getByText("重要度 3")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL because memory candidate cards do not render `evidence` or `importance`.

- [ ] **Step 3: Update memory candidate UI**

In `src/features/reviews/memory-candidates.tsx`, inside each card:

```tsx
{"importance" in candidate ? (
  <StatusPill tone="neutral">{`重要度 ${candidate.importance}`}</StatusPill>
) : null}
```

For evidence:

```tsx
{"evidence" in candidate && candidate.evidence.length > 0 ? (
  <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
    <p className="text-xs font-semibold text-[var(--muted)]">证据</p>
    <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
      {candidate.evidence.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
) : null}
```

- [ ] **Step 4: Run test**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/reviews/memory-candidates.tsx tests/unit/review-view.test.tsx
git commit -m "feat: show evidence for review memory candidates"
```

## Task 6: Save Sentence Review Phrasebook Candidates

**Files:**
- Modify: `src/features/reviews/sentence-review-panel.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing save test**

Add:

```ts
it("saves a sentence review phrasebook candidate", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ phrase: { id: "phrase_123" } }), {
      status: 201,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

  fireEvent.click(screen.getAllByRole("button", { name: "保存到表达库" })[0]);

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/phrasebook",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          "Rokid can make your multilingual meetings smoother.",
        ),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes based on Task 3**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected before Task 3: FAIL. Expected after Task 3 implementation: PASS. If it already passes, keep the test as regression coverage.

- [ ] **Step 3: Commit if changes were needed**

```bash
git add src/features/reviews/sentence-review-panel.tsx tests/unit/review-view.test.tsx
git commit -m "test: cover saving sentence review phrases"
```

## Task 7: Regression and Build Verification

**Files:**
- No source changes unless verification finds a real issue.

- [ ] **Step 1: Run targeted review tests**

Run:

```bash
npm test -- tests/unit/api-validation.test.ts tests/unit/review-generation.test.ts tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run existing related tests**

Run:

```bash
npm test -- tests/unit/static-views.test.tsx tests/unit/progress-dashboard-milestone9.test.tsx tests/unit/memory-center.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run full checks**

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 4: Browser smoke test**

Start local dev server:

```bash
PORT=3002 npm run dev
```

Open:

```text
http://localhost:3002/reviews/review_123
```

Verify:

- 30 秒复盘结论 renders.
- 逐句精修 renders.
- Grammar/word choice/naturalness issue sections are visible.
- Highlights section praises good expressions.
- Phrasebook save button is visible.
- Memory candidates still render.

- [ ] **Step 5: Final commit**

If verification required follow-up fixes:

```bash
git add src tests
git commit -m "fix: stabilize phase one review experience"
```

## Spec Coverage Checklist

- 30 秒总览: Task 4.
- 每句用户英文逐句复盘: Tasks 1, 2, 3.
- 语法错误、用词错误、不自然表达拆分: Tasks 1, 2, 3.
- 亮点肯定、高级词汇、同义替换: Tasks 1, 2, 3.
- 自然句不强行改写: Task 2 prompt and schema behavior.
- 表达库候选: Tasks 1, 3, 6.
- 长期记忆候选: Tasks 1, 2, 5.
- 弱项更新: Tasks 1, 2.
- 第二阶段长期统计预留: Task 1 structured issue/highlight/evidence fields.
