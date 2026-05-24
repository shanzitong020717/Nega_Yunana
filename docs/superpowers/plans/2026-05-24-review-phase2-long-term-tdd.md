# 长期复盘统计第二阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the second phase of the review system: 7 天 / 30 天 / 全部时间的长期复盘统计、AI 长期总结、缓存快照、记忆合并和今日建议训练联动。

**Architecture:** Use deterministic aggregation as the source of truth, then optionally call DeepSeek to turn the aggregate into a coaching-style `ReviewAnalyticsSnapshot`. Cache snapshots per time range and fall back to deterministic output when the text model fails.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Vitest, Testing Library, existing DeepSeek `generateTextJSON`, current in-memory practice/review/memory/weakness stores.

---

## File Map

- Create `src/lib/validation/review-analytics.ts`: Zod schemas and TypeScript types for long-term review analytics.
- Modify `src/lib/practice/practice-session-store.ts`: export review listing helpers and mark analytics caches stale when a review is saved.
- Create `src/lib/progress/review-analytics.ts`: deterministic aggregation from review records, weakness history, phrase candidates, and memory items.
- Create `src/lib/progress/review-analytics-store.ts`: cached snapshots per range with refresh and stale detection.
- Create `src/lib/ai/long-term-review.ts`: DeepSeek prompt and parser for long-term review summaries.
- Create `src/app/api/review-analytics/route.ts`: `GET` for cached analytics and `POST` for forced refresh.
- Create `src/lib/memory/review-memory-consolidation.ts`: merge low-sensitivity review memory candidates into long-term memory.
- Modify `src/lib/memory/memory-store.ts`: add `upsertMemoryFromReviewCandidate` or a narrow helper used by the consolidation module.
- Modify `src/features/progress/progress-view.tsx`: add long-term review dashboard sections and range tabs.
- Modify `src/app/progress/page.tsx`: fetch/pass analytics snapshot to `ProgressView`.
- Modify `src/lib/recommendations/today-recommendation.ts`: include long-term analytics plan in today recommendation input.
- Add tests:
  - `tests/unit/review-analytics-validation.test.ts`
  - `tests/unit/review-analytics.test.ts`
  - `tests/unit/long-term-review-generation.test.ts`
  - `tests/api/review-analytics.test.ts`
  - `tests/unit/progress-long-term-review.test.tsx`
  - `tests/unit/review-memory-consolidation.test.ts`
  - Update `tests/unit/today-recommendation.test.ts`

## Task 1: Long-Term Review Analytics Schema

**Files:**
- Create: `src/lib/validation/review-analytics.ts`
- Test: `tests/unit/review-analytics-validation.test.ts`

- [ ] **Step 1: Write the failing validation test**

Create `tests/unit/review-analytics-validation.test.ts`:

```ts
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
          examples: ["We have translation function and it can help your meeting."],
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-analytics-validation.test.ts
```

Expected: FAIL because `@/lib/validation/review-analytics` does not exist.

- [ ] **Step 3: Add the schema**

Create `src/lib/validation/review-analytics.ts`:

```ts
import { z } from "zod";

import { nonEmptyString } from "@/lib/validation/shared";

export const reviewAnalyticsRangeSchema = z.enum(["7d", "30d", "all"], {
  error: "长期复盘范围无效",
});

const evidenceSchema = z.array(nonEmptyString("证据不能为空")).default([]);

export const growthSignalSchema = z.object({
  id: nonEmptyString("成长信号 ID 不能为空"),
  title: nonEmptyString("成长标题不能为空"),
  summaryZh: nonEmptyString("成长总结不能为空"),
  evidence: evidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const recurringMistakeSchema = z.object({
  id: nonEmptyString("错误 ID 不能为空"),
  category: z.enum([
    "grammar",
    "word_choice",
    "naturalness",
    "conciseness",
    "business_tone",
    "logic",
    "strategy",
  ]),
  title: nonEmptyString("错误标题不能为空"),
  occurrenceCount: z.number().int().min(1),
  averageSeverity: z.number().min(1).max(5),
  lastSeenAt: z.string().datetime({ error: "最近出现时间无效" }),
  examples: z
    .array(
      z.object({
        reviewId: nonEmptyString("复盘 ID 不能为空"),
        sessionId: nonEmptyString("会话 ID 不能为空"),
        original: nonEmptyString("原句不能为空"),
        correction: nonEmptyString("修正表达不能为空"),
        explanationZh: nonEmptyString("解释不能为空"),
      }),
    )
    .default([]),
  recommendedDrill: nonEmptyString("推荐练习不能为空"),
});

export const naturalnessPatternSchema = z.object({
  id: nonEmptyString("自然度模式 ID 不能为空"),
  title: nonEmptyString("自然度标题不能为空"),
  patternZh: nonEmptyString("模式说明不能为空"),
  betterExpression: nonEmptyString("更自然表达不能为空"),
  examples: evidenceSchema,
});

export const phraseGrowthSchema = z.object({
  newPhraseCount: z.number().int().min(0),
  reviewGeneratedPhraseCount: z.number().int().min(0),
  vocabularyItems: z
    .array(
      z.object({
        term: nonEmptyString("词汇不能为空"),
        chinese: nonEmptyString("中文不能为空"),
        example: nonEmptyString("例句不能为空"),
        count: z.number().int().min(1),
      }),
    )
    .default([]),
  reusableSentences: z
    .array(
      z.object({
        english: nonEmptyString("英文表达不能为空"),
        chinese: nonEmptyString("中文表达不能为空"),
        useCase: nonEmptyString("使用场景不能为空"),
      }),
    )
    .default([]),
});

export const memoryInsightSchema = z.object({
  id: nonEmptyString("记忆洞察 ID 不能为空"),
  type: z.enum([
    "new_memory",
    "reinforced_memory",
    "conflicting_memory",
    "stale_memory",
  ]),
  title: nonEmptyString("记忆标题不能为空"),
  summaryZh: nonEmptyString("记忆总结不能为空"),
  evidence: evidenceSchema,
  action: z.enum(["keep", "merge", "disable", "review_manually"]),
});

export const nextTrainingPlanSchema = z.object({
  title: nonEmptyString("训练标题不能为空"),
  reasonZh: nonEmptyString("推荐原因不能为空"),
  goalId: nonEmptyString("训练目标不能为空"),
  mode: nonEmptyString("训练模式不能为空"),
  personaId: nonEmptyString("客户角色不能为空"),
  voicePackId: nonEmptyString("音色不能为空"),
  materialMode: z.enum(["recent_material", "no_material", "memory_context"]),
  focusTags: z.array(nonEmptyString("训练重点不能为空")).min(1),
  estimatedMinutes: z.number().int().min(1).max(30),
});

export const reviewAnalyticsSnapshotSchema = z.object({
  id: nonEmptyString("长期复盘 ID 不能为空"),
  range: reviewAnalyticsRangeSchema,
  generatedAt: z.string().datetime({ error: "生成时间无效" }),
  staleAfter: z.string().datetime({ error: "过期时间无效" }),
  sourceReviewIds: z.array(nonEmptyString("复盘 ID 不能为空")).default([]),
  sourceSessionIds: z.array(nonEmptyString("会话 ID 不能为空")).default([]),
  trainingCount: z.number().int().min(0),
  summaryZh: nonEmptyString("长期复盘总结不能为空"),
  topGrowthSignals: z.array(growthSignalSchema).default([]),
  recurringMistakes: z.array(recurringMistakeSchema).default([]),
  naturalnessPatterns: z.array(naturalnessPatternSchema).default([]),
  phraseGrowth: phraseGrowthSchema,
  memoryInsights: z.array(memoryInsightSchema).default([]),
  nextTrainingPlan: nextTrainingPlanSchema,
  aiGenerated: z.boolean(),
});

export type ReviewAnalyticsRange = z.infer<typeof reviewAnalyticsRangeSchema>;
export type ReviewAnalyticsSnapshot = z.infer<
  typeof reviewAnalyticsSnapshotSchema
>;
export type RecurringMistake = z.infer<typeof recurringMistakeSchema>;
export type GrowthSignal = z.infer<typeof growthSignalSchema>;
export type NextTrainingPlan = z.infer<typeof nextTrainingPlanSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- tests/unit/review-analytics-validation.test.ts
```

Expected: PASS.

## Task 2: Deterministic Long-Term Analytics Aggregation

**Files:**
- Modify: `src/lib/practice/practice-session-store.ts`
- Create: `src/lib/progress/review-analytics.ts`
- Test: `tests/unit/review-analytics.test.ts`

- [ ] **Step 1: Write the failing aggregation test**

Create `tests/unit/review-analytics.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildReviewAnalyticsDraft } from "@/lib/progress/review-analytics";
import type { ReviewRecord } from "@/lib/practice/practice-session-store";

const baseCreatedAt = "2026-05-24T08:00:00.000Z";

function makeReview(
  id: string,
  sessionId: string,
  overrides: Partial<ReviewRecord> = {},
): ReviewRecord {
  return {
    id,
    sessionId,
    createdAt: baseCreatedAt,
    updatedAt: baseCreatedAt,
    meetingOutcome: {
      summary: "The learner explained the value.",
      customerReaction: "Interested.",
      nextStep: "Run a pilot.",
    },
    reviewSnapshot: {
      overallSummaryZh: "本次能说明价值，但回答还可以更自然。",
      strengths: ["能连接会议场景"],
      priorityImprovements: ["减少直译式功能表达"],
      phrasebookCandidateCount: 1,
      memoryCandidateCount: 1,
      nextPracticeFocus: "应用场景说明",
    },
    scores: {
      clarity: { score: 4, rationale: "Clear." },
      businessConfidence: { score: 3, rationale: "Needs confidence." },
      discoverySkill: { score: 3, rationale: "Some discovery." },
      productPositioning: { score: 4, rationale: "Relevant." },
      objectionHandling: { score: 3, rationale: "Safe." },
      englishNaturalness: { score: 3, rationale: "Understandable." },
    },
    topImprovements: ["Lead with customer value."],
    bestMoments: ["Connected captions to meetings."],
    sentenceReviews: [
      {
        id: `${id}_sentence_1`,
        original: "We have translation function.",
        translationZh: "我们有翻译功能。",
        quality: "needs_improvement",
        grammarIssues: [],
        wordChoiceIssues: [
          {
            type: "word_choice",
            severity: 3,
            originalFragment: "translation function",
            correction: "real-time translated captions",
            explanationZh: "用具体产品能力替代直译表达。",
          },
        ],
        naturalnessIssues: [
          {
            type: "naturalness",
            severity: 3,
            originalFragment: "We have translation function.",
            correction:
              "Rokid makes multilingual meetings easier to follow.",
            explanationZh: "改成客户结果更自然。",
          },
        ],
        highlights: [
          {
            type: "customer_empathy",
            text: "meeting",
            explanationZh: "围绕客户会议场景回答。",
            alternatives: ["meeting flow"],
          },
        ],
        upgradedExpression:
          "Rokid makes multilingual meetings easier to follow.",
        upgradedExpressionZh: "Rokid 让多语言会议更容易跟上。",
        reasonZh: "更像商务表达。",
        practicePrompt: "重新说一次。",
        vocabulary: [
          {
            term: "multilingual meetings",
            phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈmiːtɪŋz/",
            chinese: "多语言会议",
            example: "Rokid makes multilingual meetings easier to follow.",
            sourceSentence: "We have translation function.",
          },
        ],
        phrasebookCandidate: {
          english: "Rokid makes multilingual meetings easier to follow.",
          chinese: "Rokid 让多语言会议更容易跟上。",
          useCase: "说明会议场景价值。",
          tags: ["review", "sentence-review"],
        },
      },
    ],
    sentenceUpgrades: [],
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [],
    weaknessUpdates: [
      {
        type: "feature_only_talk",
        severity: 3,
        evidence: "The answer started with a feature.",
        recommendedDrill: "功能转价值练习",
      },
    ],
    memoryCandidates: [],
    nextSessionRecommendation: {
      focus: "应用场景说明",
      drill: "Feature-to-value drill",
      prompt: "Explain value in two sentences.",
    },
    ...overrides,
  };
}

describe("buildReviewAnalyticsDraft", () => {
  it("aggregates recurring mistakes, growth signals, phrase growth, and next plan", () => {
    const reviews = [
      makeReview("review_1", "session_1"),
      makeReview("review_2", "session_2"),
    ];

    const draft = buildReviewAnalyticsDraft({
      range: "7d",
      now: new Date("2026-05-24T12:00:00.000Z"),
      reviews,
      memories: [],
    });

    expect(draft.range).toBe("7d");
    expect(draft.trainingCount).toBe(2);
    expect(draft.sourceReviewIds).toEqual(["review_1", "review_2"]);
    expect(draft.recurringMistakes[0]).toMatchObject({
      category: "word_choice",
      occurrenceCount: 2,
      averageSeverity: 3,
      recommendedDrill: "功能转客户价值表达练习",
    });
    expect(draft.topGrowthSignals[0]?.title).toContain("会议场景");
    expect(draft.phraseGrowth.vocabularyItems[0]).toMatchObject({
      term: "multilingual meetings",
      count: 2,
    });
    expect(draft.nextTrainingPlan.focusTags).toEqual(
      expect.arrayContaining(["应用场景说明"]),
    );
  });

  it("returns a data-insufficient snapshot when the range has fewer than two reviews", () => {
    const draft = buildReviewAnalyticsDraft({
      range: "7d",
      now: new Date("2026-05-24T12:00:00.000Z"),
      reviews: [makeReview("review_1", "session_1")],
      memories: [],
    });

    expect(draft.trainingCount).toBe(1);
    expect(draft.summaryZh).toContain("数据还不够形成长期趋势");
    expect(draft.aiGenerated).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-analytics.test.ts
```

Expected: FAIL because `@/lib/progress/review-analytics` does not exist.

- [ ] **Step 3: Export review listing helpers**

Modify `src/lib/practice/practice-session-store.ts`:

```ts
export function listReviewRecords() {
  return Array.from(reviewRecords.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function listReviewRecordsForRange(input: {
  range: "7d" | "30d" | "all";
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (input.range === "all") {
    return listReviewRecords();
  }

  const windowDays = input.range === "7d" ? 7 : 30;
  const earliestMs = now.getTime() - windowDays * 86_400_000;

  return listReviewRecords().filter(
    (review) => new Date(review.createdAt).getTime() >= earliestMs,
  );
}
```

- [ ] **Step 4: Add deterministic aggregation**

Create `src/lib/progress/review-analytics.ts`:

```ts
import type { MemoryItem } from "@/lib/validation/memory";
import {
  type ReviewAnalyticsRange,
  type ReviewAnalyticsSnapshot,
  reviewAnalyticsSnapshotSchema,
} from "@/lib/validation/review-analytics";
import type { ReviewRecord } from "@/lib/practice/practice-session-store";

type BuildReviewAnalyticsDraftInput = {
  range: ReviewAnalyticsRange;
  now?: Date;
  reviews: ReviewRecord[];
  memories: MemoryItem[];
};

function endOfDay(date: Date) {
  const staleAfter = new Date(date);
  staleAfter.setHours(23, 59, 59, 999);
  return staleAfter.toISOString();
}

function stableId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function defaultNextPlan(focusTags: string[]): ReviewAnalyticsSnapshot["nextTrainingPlan"] {
  const firstFocus = focusTags[0] ?? "应用场景说明";

  return {
    title: `继续练习 · ${firstFocus}`,
    reasonZh: "根据最近复盘，下一次适合继续练习更短、更有客户价值的回答。",
    goalId: firstFocus.includes("隐私") ? "privacy_security" : "application_scenarios",
    mode: firstFocus.includes("隐私") ? "objection_challenge" : "customer_qa",
    personaId: firstFocus.includes("隐私") ? "technical_lead" : "enterprise_buyer",
    voicePackId: firstFocus.includes("隐私") ? "charon-informative" : "kore-firm",
    materialMode: "memory_context",
    focusTags: focusTags.length > 0 ? focusTags.slice(0, 3) : ["应用场景说明"],
    estimatedMinutes: 8,
  };
}

export function buildReviewAnalyticsDraft(
  input: BuildReviewAnalyticsDraftInput,
): ReviewAnalyticsSnapshot {
  const now = input.now ?? new Date();
  const sourceReviewIds = input.reviews.map((review) => review.id);
  const sourceSessionIds = input.reviews.map((review) => review.sessionId);

  if (input.reviews.length < 2) {
    return reviewAnalyticsSnapshotSchema.parse({
      id: `review_analytics_${input.range}`,
      range: input.range,
      generatedAt: now.toISOString(),
      staleAfter: endOfDay(now),
      sourceReviewIds,
      sourceSessionIds,
      trainingCount: input.reviews.length,
      summaryZh:
        "数据还不够形成长期趋势。完成至少 2 次练习后，系统会开始总结经常犯的错误和成长变化。",
      topGrowthSignals: [],
      recurringMistakes: [],
      naturalnessPatterns: [],
      phraseGrowth: {
        newPhraseCount: 0,
        reviewGeneratedPhraseCount: 0,
        vocabularyItems: [],
        reusableSentences: [],
      },
      memoryInsights: input.memories.slice(0, 3).map((memory) => ({
        id: `memory_${memory.id}`,
        type: "reinforced_memory",
        title: memory.title,
        summaryZh: memory.summary,
        evidence: [memory.summary],
        action: "keep",
      })),
      nextTrainingPlan: defaultNextPlan(["应用场景说明"]),
      aiGenerated: false,
    });
  }

  const issueGroups = new Map<
    string,
    {
      category: ReviewAnalyticsSnapshot["recurringMistakes"][number]["category"];
      title: string;
      severities: number[];
      lastSeenAt: string;
      examples: ReviewAnalyticsSnapshot["recurringMistakes"][number]["examples"];
    }
  >();
  const vocabularyCounts = new Map<
    string,
    { term: string; chinese: string; example: string; count: number }
  >();
  const reusableSentences: ReviewAnalyticsSnapshot["phraseGrowth"]["reusableSentences"] =
    [];
  const strengths = new Set<string>();
  const focusTags = new Set<string>();

  input.reviews.forEach((review) => {
    review.reviewSnapshot?.strengths.forEach((strength) => strengths.add(strength));
    review.nextSessionRecommendation.focus
      .split(/[,，、]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => focusTags.add(tag));

    review.sentenceReviews.forEach((sentenceReview) => {
      const issues = [
        ...sentenceReview.grammarIssues,
        ...sentenceReview.wordChoiceIssues,
        ...sentenceReview.naturalnessIssues,
      ];

      issues.forEach((issue) => {
        const key = `${issue.type}:${issue.originalFragment}:${issue.correction}`;
        const existing = issueGroups.get(key);
        const example = {
          reviewId: review.id,
          sessionId: review.sessionId,
          original: sentenceReview.original,
          correction: issue.correction,
          explanationZh: issue.explanationZh,
        };

        if (existing) {
          existing.severities.push(issue.severity);
          existing.lastSeenAt = review.createdAt > existing.lastSeenAt
            ? review.createdAt
            : existing.lastSeenAt;
          if (existing.examples.length < 3) {
            existing.examples.push(example);
          }
          return;
        }

        issueGroups.set(key, {
          category: issue.type === "word_choice" ? "word_choice" : issue.type,
          title: issue.originalFragment,
          severities: [issue.severity],
          lastSeenAt: review.createdAt,
          examples: [example],
        });
      });

      sentenceReview.highlights.forEach((highlight) =>
        strengths.add(highlight.explanationZh),
      );

      sentenceReview.vocabulary.forEach((item) => {
        const key = item.term.toLowerCase();
        const existing = vocabularyCounts.get(key);
        vocabularyCounts.set(key, {
          term: item.term,
          chinese: item.chinese,
          example: item.example,
          count: (existing?.count ?? 0) + 1,
        });
      });

      if (sentenceReview.phrasebookCandidate) {
        reusableSentences.push({
          english: sentenceReview.phrasebookCandidate.english,
          chinese: sentenceReview.phrasebookCandidate.chinese,
          useCase: sentenceReview.phrasebookCandidate.useCase,
        });
      }
    });
  });

  const recurringMistakes = Array.from(issueGroups.entries())
    .map(([key, group]) => ({
      id: `mistake_${stableId(key)}`,
      category: group.category,
      title: group.title,
      occurrenceCount: group.severities.length,
      averageSeverity:
        group.severities.reduce((sum, severity) => sum + severity, 0) /
        group.severities.length,
      lastSeenAt: group.lastSeenAt,
      examples: group.examples,
      recommendedDrill:
        group.category === "word_choice"
          ? "功能转客户价值表达练习"
          : "逐句自然度精修练习",
    }))
    .sort((left, right) => {
      if (right.occurrenceCount !== left.occurrenceCount) {
        return right.occurrenceCount - left.occurrenceCount;
      }
      return right.averageSeverity - left.averageSeverity;
    })
    .slice(0, 5);

  const snapshot = {
    id: `review_analytics_${input.range}`,
    range: input.range,
    generatedAt: now.toISOString(),
    staleAfter: endOfDay(now),
    sourceReviewIds,
    sourceSessionIds,
    trainingCount: input.reviews.length,
    summaryZh:
      "系统已根据历史复盘生成长期统计。AI 总结生成前，先展示本地可解释统计结果。",
    topGrowthSignals: Array.from(strengths)
      .slice(0, 3)
      .map((strength, index) => ({
        id: `growth_${index + 1}`,
        title: strength.includes("会议") ? "会议场景表达更清楚" : "表达亮点增加",
        summaryZh: strength,
        evidence: [strength],
        confidence: 0.78,
      })),
    recurringMistakes,
    naturalnessPatterns: recurringMistakes
      .filter((mistake) => mistake.category === "naturalness")
      .slice(0, 3)
      .map((mistake) => ({
        id: `pattern_${stableId(mistake.title)}`,
        title: `${mistake.title} 不够自然`,
        patternZh: mistake.examples[0]?.explanationZh ?? "需要更自然表达。",
        betterExpression: mistake.examples[0]?.correction ?? mistake.title,
        examples: mistake.examples.map((example) => example.original),
      })),
    phraseGrowth: {
      newPhraseCount: reusableSentences.length,
      reviewGeneratedPhraseCount: reusableSentences.length,
      vocabularyItems: Array.from(vocabularyCounts.values())
        .sort((left, right) => right.count - left.count)
        .slice(0, 8),
      reusableSentences: reusableSentences.slice(0, 5),
    },
    memoryInsights: input.memories.slice(0, 3).map((memory) => ({
      id: `memory_${memory.id}`,
      type: "reinforced_memory",
      title: memory.title,
      summaryZh: memory.summary,
      evidence: [memory.summary],
      action: "keep",
    })),
    nextTrainingPlan: defaultNextPlan(Array.from(focusTags)),
    aiGenerated: false,
  } satisfies ReviewAnalyticsSnapshot;

  return reviewAnalyticsSnapshotSchema.parse(snapshot);
}
```

- [ ] **Step 5: Run the aggregation test to verify it passes**

Run:

```bash
npm test -- tests/unit/review-analytics.test.ts
```

Expected: PASS.

## Task 3: DeepSeek Long-Term Review Generation

**Files:**
- Create: `src/lib/ai/long-term-review.ts`
- Test: `tests/unit/long-term-review-generation.test.ts`

- [ ] **Step 1: Write the failing AI generation test**

Create `tests/unit/long-term-review-generation.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY: "DeepSeek text analysis boundary",
  generateTextJSON: generateTextJSONMock,
  hasTextAIApiKey: vi.fn(() => true),
}));

import { generateLongTermReview } from "@/lib/ai/long-term-review";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

const draft: ReviewAnalyticsSnapshot = {
  id: "review_analytics_7d",
  range: "7d",
  generatedAt: "2026-05-24T09:00:00.000Z",
  staleAfter: "2026-05-24T23:59:59.999Z",
  sourceReviewIds: ["review_1", "review_2"],
  sourceSessionIds: ["session_1", "session_2"],
  trainingCount: 2,
  summaryZh: "本地统计草稿。",
  topGrowthSignals: [],
  recurringMistakes: [
    {
      id: "mistake_translation_function",
      category: "word_choice",
      title: "translation function",
      occurrenceCount: 2,
      averageSeverity: 3,
      lastSeenAt: "2026-05-24T08:00:00.000Z",
      examples: [
        {
          reviewId: "review_1",
          sessionId: "session_1",
          original: "We have translation function.",
          correction: "real-time translated captions",
          explanationZh: "用具体产品能力替代直译表达。",
        },
      ],
      recommendedDrill: "功能转客户价值表达练习",
    },
  ],
  naturalnessPatterns: [],
  phraseGrowth: {
    newPhraseCount: 1,
    reviewGeneratedPhraseCount: 1,
    vocabularyItems: [],
    reusableSentences: [],
  },
  memoryInsights: [],
  nextTrainingPlan: {
    title: "继续练习 · 应用场景说明",
    reasonZh: "继续练习客户价值表达。",
    goalId: "application_scenarios",
    mode: "customer_qa",
    personaId: "enterprise_buyer",
    voicePackId: "kore-firm",
    materialMode: "memory_context",
    focusTags: ["应用场景说明"],
    estimatedMinutes: 8,
  },
  aiGenerated: false,
};

describe("generateLongTermReview", () => {
  beforeEach(() => {
    generateTextJSONMock.mockReset();
  });

  it("asks DeepSeek to summarize deterministic analytics without raw transcript text", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      ...draft,
      summaryZh:
        "近 7 天你更能说明应用场景，但仍需要减少直译式功能表达。",
      aiGenerated: true,
    });

    const result = await generateLongTermReview({ draft });

    expect(generateTextJSONMock).toHaveBeenCalledTimes(1);
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("长期复盘");
    expect(prompt).toContain("recurringMistakes");
    expect(prompt).toContain("nextTrainingPlan");
    expect(prompt).toContain("Do not use Gemini");
    expect(prompt).not.toContain("full raw transcript");
    expect(result.aiGenerated).toBe(true);
    expect(result.summaryZh).toContain("近 7 天");
  });

  it("returns the deterministic draft when DeepSeek fails", async () => {
    generateTextJSONMock.mockRejectedValueOnce(new Error("model timeout"));

    const result = await generateLongTermReview({ draft });

    expect(result.aiGenerated).toBe(false);
    expect(result.summaryZh).toBe("本地统计草稿。");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/long-term-review-generation.test.ts
```

Expected: FAIL because `@/lib/ai/long-term-review` does not exist.

- [ ] **Step 3: Add long-term review generation**

Create `src/lib/ai/long-term-review.ts`:

```ts
import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";
import {
  type ReviewAnalyticsSnapshot,
  reviewAnalyticsSnapshotSchema,
} from "@/lib/validation/review-analytics";

type GenerateLongTermReviewInput = {
  draft: ReviewAnalyticsSnapshot;
  mockMode?: boolean;
};

function shouldUseDraft(input: GenerateLongTermReviewInput) {
  return input.mockMode === true || process.env.AI_MOCK_MODE === "true" || !hasTextAIApiKey();
}

function buildPrompt(draft: ReviewAnalyticsSnapshot) {
  return [
    "You are generating a long-term review summary for a Rokid overseas sales English speaking coach.",
    "This is 长期复盘. Summarize learning growth, recurring mistakes, phrase growth, memory insights, and next training plan.",
    TEXT_ANALYSIS_BOUNDARY,
    "Do not use Gemini. Gemini is only for realtime audio. Use DeepSeek only for offline JSON text analysis.",
    "Return strict JSON matching the provided ReviewAnalyticsSnapshot shape.",
    "Keep sourceReviewIds, sourceSessionIds, range, generatedAt, staleAfter, and trainingCount unchanged.",
    "Improve summaryZh, topGrowthSignals, recurringMistakes, naturalnessPatterns, memoryInsights, and nextTrainingPlan based on the deterministic draft.",
    "Do not invent product claims, pricing, certifications, or customer confidential details.",
    "Do not request or include full raw transcript text. Use only the structured analytics draft.",
    `Draft analytics JSON: ${JSON.stringify(draft)}`,
  ].join("\n\n");
}

export async function generateLongTermReview(
  input: GenerateLongTermReviewInput,
): Promise<ReviewAnalyticsSnapshot> {
  if (shouldUseDraft(input)) {
    return input.draft;
  }

  try {
    const result = await generateTextJSON({
      prompt: buildPrompt(input.draft),
      schemaName: "long-term review analytics",
      maxTokens: 8192,
    });

    return reviewAnalyticsSnapshotSchema.parse({
      ...input.draft,
      ...result,
      id: input.draft.id,
      range: input.draft.range,
      generatedAt: input.draft.generatedAt,
      staleAfter: input.draft.staleAfter,
      sourceReviewIds: input.draft.sourceReviewIds,
      sourceSessionIds: input.draft.sourceSessionIds,
      trainingCount: input.draft.trainingCount,
      aiGenerated: true,
    });
  } catch {
    return input.draft;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- tests/unit/long-term-review-generation.test.ts
```

Expected: PASS.

## Task 4: Analytics Cache Store and API

**Files:**
- Create: `src/lib/progress/review-analytics-store.ts`
- Create: `src/app/api/review-analytics/route.ts`
- Test: `tests/api/review-analytics.test.ts`

- [ ] **Step 1: Write the failing API test**

Create `tests/api/review-analytics.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateLongTermReviewMock } = vi.hoisted(() => ({
  generateLongTermReviewMock: vi.fn(),
}));

vi.mock("@/lib/ai/long-term-review", () => ({
  generateLongTermReview: generateLongTermReviewMock,
}));

import { GET, POST } from "@/app/api/review-analytics/route";
import { saveReviewRecord } from "@/lib/practice/practice-session-store";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

const routeContext = {};

function request(url: string, init?: RequestInit) {
  return new Request(`http://localhost${url}`, init);
}

function reviewBody(summary: string): PracticeReviewPayload {
  return {
    meetingOutcome: {
      summary,
      customerReaction: "Interested.",
      nextStep: "Run a pilot.",
    },
    reviewSnapshot: {
      overallSummaryZh: summary,
      strengths: ["能连接会议场景"],
      priorityImprovements: ["减少直译式功能表达"],
      phrasebookCandidateCount: 1,
      memoryCandidateCount: 1,
      nextPracticeFocus: "应用场景说明",
    },
    scores: {
      clarity: { score: 4, rationale: "Clear." },
      businessConfidence: { score: 3, rationale: "Needs stronger framing." },
      discoverySkill: { score: 3, rationale: "Some discovery." },
      productPositioning: { score: 4, rationale: "Relevant." },
      objectionHandling: { score: 3, rationale: "Safe." },
      englishNaturalness: { score: 3, rationale: "Understandable." },
    },
    topImprovements: ["Lead with customer value."],
    bestMoments: ["Connected captions to meetings."],
    sentenceReviews: [],
    sentenceUpgrades: [],
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [],
    weaknessUpdates: [],
    memoryCandidates: [],
    nextSessionRecommendation: {
      focus: "应用场景说明",
      drill: "Feature-to-value drill",
      prompt: "Explain value in two sentences.",
    },
  };
}

describe("review analytics API", () => {
  beforeEach(() => {
    generateLongTermReviewMock.mockReset();
  });

  it("returns generated long-term analytics for a requested range", async () => {
    saveReviewRecord("session_api_1", reviewBody("Review one"));
    saveReviewRecord("session_api_2", reviewBody("Review two"));
    generateLongTermReviewMock.mockImplementation(async ({ draft }) => ({
      ...draft,
      summaryZh: "近 7 天你能更清楚说明应用场景。",
      aiGenerated: true,
    }));

    const response = await GET(request("/api/review-analytics?range=7d"), routeContext);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analytics.range).toBe("7d");
    expect(payload.analytics.summaryZh).toContain("近 7 天");
    expect(payload.analytics.aiGenerated).toBe(true);
  });

  it("forces refresh through POST", async () => {
    generateLongTermReviewMock.mockImplementation(async ({ draft }) => ({
      ...draft,
      summaryZh: "手动刷新后的长期复盘。",
      aiGenerated: true,
    }));

    const response = await POST(
      request("/api/review-analytics", {
        method: "POST",
        body: JSON.stringify({ range: "30d" }),
      }),
      routeContext,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analytics.range).toBe("30d");
    expect(payload.analytics.summaryZh).toContain("手动刷新");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/api/review-analytics.test.ts
```

Expected: FAIL because the API route and store do not exist.

- [ ] **Step 3: Add the analytics store**

Create `src/lib/progress/review-analytics-store.ts`:

```ts
import { generateLongTermReview } from "@/lib/ai/long-term-review";
import { listMemories } from "@/lib/memory/memory-store";
import {
  listReviewRecordsForRange,
  type ReviewRecord,
} from "@/lib/practice/practice-session-store";
import { buildReviewAnalyticsDraft } from "@/lib/progress/review-analytics";
import {
  type ReviewAnalyticsRange,
  type ReviewAnalyticsSnapshot,
} from "@/lib/validation/review-analytics";

const analyticsCache = new Map<ReviewAnalyticsRange, ReviewAnalyticsSnapshot>();

function isStale(snapshot: ReviewAnalyticsSnapshot, now: Date) {
  return new Date(snapshot.staleAfter).getTime() <= now.getTime();
}

export function clearReviewAnalyticsCache() {
  analyticsCache.clear();
}

export function getCachedReviewAnalytics(range: ReviewAnalyticsRange) {
  return analyticsCache.get(range) ?? null;
}

export async function getOrGenerateReviewAnalytics(input: {
  range: ReviewAnalyticsRange;
  forceRefresh?: boolean;
  now?: Date;
  reviews?: ReviewRecord[];
}) {
  const now = input.now ?? new Date();
  const cached = analyticsCache.get(input.range);

  if (cached && !input.forceRefresh && !isStale(cached, now)) {
    return cached;
  }

  const reviews =
    input.reviews ??
    listReviewRecordsForRange({
      range: input.range,
      now,
    });
  const draft = buildReviewAnalyticsDraft({
    range: input.range,
    now,
    reviews,
    memories: listMemories({ enabledForAi: true }),
  });
  const analytics = await generateLongTermReview({ draft });

  analyticsCache.set(input.range, analytics);

  return analytics;
}
```

- [ ] **Step 4: Mark analytics stale when a review is saved**

Modify `src/lib/practice/practice-session-store.ts`:

```ts
import { clearReviewAnalyticsCache } from "@/lib/progress/review-analytics-store";
```

Then add this line at the end of `saveReviewRecord`, before `return reviewRecord;`:

```ts
clearReviewAnalyticsCache();
```

- [ ] **Step 5: Add the API route**

Create `src/app/api/review-analytics/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/errors";
import { getOrGenerateReviewAnalytics } from "@/lib/progress/review-analytics-store";
import { reviewAnalyticsRangeSchema } from "@/lib/validation/review-analytics";

const refreshInputSchema = z.object({
  range: reviewAnalyticsRangeSchema.default("7d"),
});

function rangeFromUrl(request: Request) {
  const url = new URL(request.url);
  return reviewAnalyticsRangeSchema.parse(url.searchParams.get("range") ?? "7d");
}

export async function GET(request: Request) {
  try {
    const range = rangeFromUrl(request);
    const analytics = await getOrGenerateReviewAnalytics({ range });

    return NextResponse.json({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = refreshInputSchema.parse(await request.json());
    const analytics = await getOrGenerateReviewAnalytics({
      range: input.range,
      forceRefresh: true,
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 6: Run the API test to verify it passes**

Run:

```bash
npm test -- tests/api/review-analytics.test.ts
```

Expected: PASS.

## Task 5: Memory Consolidation from Review Candidates

**Files:**
- Create: `src/lib/memory/review-memory-consolidation.ts`
- Modify: `src/lib/memory/memory-store.ts`
- Modify: `src/lib/practice/practice-session-store.ts`
- Test: `tests/unit/review-memory-consolidation.test.ts`

- [ ] **Step 1: Write the failing consolidation test**

Create `tests/unit/review-memory-consolidation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { consolidateReviewMemoryCandidates } from "@/lib/memory/review-memory-consolidation";
import { listMemories } from "@/lib/memory/memory-store";
import type { MemoryCandidate } from "@/lib/validation/reviews";

describe("consolidateReviewMemoryCandidates", () => {
  it("saves low-sensitivity enabled candidates and skips high-sensitivity candidates", () => {
    const candidates: MemoryCandidate[] = [
      {
        type: "speaking_pattern",
        title: "Feature-first answering pattern",
        summary: "The learner tends to explain features before customer value.",
        evidence: ["We have translation function."],
        sensitivity: "low",
        confidence: 0.84,
        importance: 4,
        enabledForAi: true,
      },
      {
        type: "customer_context",
        title: "Confidential hospital pricing",
        summary: "Contains sensitive customer pricing.",
        evidence: ["Private pricing discussion."],
        sensitivity: "high",
        confidence: 0.9,
        importance: 5,
        enabledForAi: true,
      },
    ];

    const saved = consolidateReviewMemoryCandidates({
      candidates,
      sourceCreatedAt: "2026-05-24T09:00:00.000Z",
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]?.title).toBe("Feature-first answering pattern");
    expect(saved[0]?.enabledForAi).toBe(true);
    expect(
      listMemories({ enabledForAi: true }).some((memory) =>
        memory.title.includes("Feature-first"),
      ),
    ).toBe(true);
    expect(
      listMemories({ type: "customer_context" }).some((memory) =>
        memory.title.includes("Confidential hospital pricing"),
      ),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-memory-consolidation.test.ts
```

Expected: FAIL because the consolidation module does not exist.

- [ ] **Step 3: Add a memory upsert helper**

Modify `src/lib/memory/memory-store.ts`:

```ts
export function findMemoryByTypeAndTitle(input: {
  type: MemoryType;
  title: string;
}) {
  const normalizedTitle = input.title.trim().toLowerCase();

  return (
    Array.from(memoryItems.values()).find(
      (memory) =>
        memory.type === input.type &&
        memory.title.trim().toLowerCase() === normalizedTitle,
    ) ?? null
  );
}

export function upsertMemoryByTypeAndTitle(input: CreateMemoryInput) {
  const existingMemory = findMemoryByTypeAndTitle({
    type: input.type,
    title: input.title,
  });

  if (!existingMemory) {
    return createMemory(input);
  }

  const mergedConfidence = Number(
    ((existingMemory.confidence + input.confidence) / 2).toFixed(2),
  );

  return updateMemory(existingMemory.id, {
    summary: input.summary,
    confidence: mergedConfidence,
    importance: Math.max(existingMemory.importance, input.importance),
    enabledForAi: existingMemory.enabledForAi && input.enabledForAi,
    sensitive: existingMemory.sensitive || input.sensitive,
    expiresAt: input.expiresAt,
  })!;
}
```

- [ ] **Step 4: Add consolidation logic**

Create `src/lib/memory/review-memory-consolidation.ts`:

```ts
import { upsertMemoryByTypeAndTitle } from "@/lib/memory/memory-store";
import type { MemoryType } from "@/lib/validation/memory";
import type { MemoryCandidate } from "@/lib/validation/reviews";

type ConsolidateReviewMemoryCandidatesInput = {
  candidates: MemoryCandidate[];
  sourceCreatedAt?: string;
};

const typeMap: Record<string, MemoryType> = {
  recurring_error: "weakness",
  speaking_pattern: "speaking_habit",
  strength: "learning_preference",
  learning_preference: "learning_preference",
  practice_focus: "learning_preference",
  material_context: "material_context",
  customer_context: "customer_context",
};

function mapMemoryType(type: string): MemoryType {
  return typeMap[type] ?? "speaking_habit";
}

function shouldAutoSave(candidate: MemoryCandidate) {
  return candidate.enabledForAi && candidate.sensitivity !== "high";
}

function summaryWithEvidence(candidate: MemoryCandidate) {
  if (candidate.evidence.length === 0) {
    return candidate.summary;
  }

  return `${candidate.summary}\n证据：${candidate.evidence.slice(0, 3).join(" / ")}`;
}

export function consolidateReviewMemoryCandidates(
  input: ConsolidateReviewMemoryCandidatesInput,
) {
  return input.candidates
    .filter(shouldAutoSave)
    .map((candidate) =>
      upsertMemoryByTypeAndTitle({
        type: mapMemoryType(candidate.type),
        title: candidate.title,
        summary: summaryWithEvidence(candidate),
        source: "review",
        sourceCreatedAt: input.sourceCreatedAt,
        confidence: candidate.confidence,
        importance: candidate.importance,
        enabledForAi: candidate.enabledForAi,
        sensitive: candidate.sensitivity !== "low",
      }),
    );
}
```

- [ ] **Step 5: Call consolidation when saving a review**

Modify `src/lib/practice/practice-session-store.ts`:

```ts
import { consolidateReviewMemoryCandidates } from "@/lib/memory/review-memory-consolidation";
```

Add this before `clearReviewAnalyticsCache();` in `saveReviewRecord`:

```ts
consolidateReviewMemoryCandidates({
  candidates: review.memoryCandidates,
  sourceCreatedAt: now,
});
```

- [ ] **Step 6: Run consolidation tests**

Run:

```bash
npm test -- tests/unit/review-memory-consolidation.test.ts tests/unit/review-view.test.tsx tests/unit/memory-center.test.tsx
```

Expected: PASS.

## Task 6: Progress UI for Long-Term Review

**Files:**
- Modify: `src/features/progress/progress-view.tsx`
- Modify: `src/app/progress/page.tsx`
- Test: `tests/unit/progress-long-term-review.test.tsx`

- [ ] **Step 1: Write the failing UI test**

Create `tests/unit/progress-long-term-review.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProgressView } from "@/features/progress/progress-view";
import type { ProgressSummary } from "@/lib/progress/weakness-store";
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";

const progress: ProgressSummary = {
  recentTrainingCount: 4,
  topWeaknesses: [],
  improvedWeaknesses: [],
  recommendedDrills: [],
  history: [],
};

const analytics: ReviewAnalyticsSnapshot = {
  id: "review_analytics_7d",
  range: "7d",
  generatedAt: "2026-05-24T09:00:00.000Z",
  staleAfter: "2026-05-24T23:59:59.999Z",
  sourceReviewIds: ["review_1", "review_2"],
  sourceSessionIds: ["session_1", "session_2"],
  trainingCount: 2,
  summaryZh: "近 7 天你更能说明应用场景，但仍需要减少直译式功能表达。",
  topGrowthSignals: [
    {
      id: "growth_1",
      title: "应用场景说明更清楚",
      summaryZh: "你开始把实时字幕连接到会议效率。",
      evidence: ["Rokid makes multilingual meetings easier to follow."],
      confidence: 0.82,
    },
  ],
  recurringMistakes: [
    {
      id: "mistake_1",
      category: "word_choice",
      title: "translation function",
      occurrenceCount: 2,
      averageSeverity: 3,
      lastSeenAt: "2026-05-24T08:00:00.000Z",
      examples: [
        {
          reviewId: "review_1",
          sessionId: "session_1",
          original: "We have translation function.",
          correction: "real-time translated captions",
          explanationZh: "用具体产品能力替代直译表达。",
        },
      ],
      recommendedDrill: "功能转客户价值表达练习",
    },
  ],
  naturalnessPatterns: [],
  phraseGrowth: {
    newPhraseCount: 2,
    reviewGeneratedPhraseCount: 2,
    vocabularyItems: [
      {
        term: "multilingual meetings",
        chinese: "多语言会议",
        example: "Rokid makes multilingual meetings easier to follow.",
        count: 2,
      },
    ],
    reusableSentences: [],
  },
  memoryInsights: [],
  nextTrainingPlan: {
    title: "企业买家 · 应用场景说明",
    reasonZh: "继续练习应用场景表达。",
    goalId: "application_scenarios",
    mode: "customer_qa",
    personaId: "enterprise_buyer",
    voicePackId: "kore-firm",
    materialMode: "memory_context",
    focusTags: ["应用场景说明"],
    estimatedMinutes: 8,
  },
  aiGenerated: true,
};

describe("ProgressView long-term review", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders long-term analytics and refreshes the selected range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          analytics: {
            ...analytics,
            range: "30d",
            summaryZh: "近 30 天你已经形成更稳定的商务表达。",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ProgressView progress={progress} analytics={analytics} />);

    expect(screen.getByText("长期复盘")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 7 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();
    expect(screen.getByText(analytics.summaryZh)).toBeInTheDocument();
    expect(screen.getByText("经常犯的错误")).toBeInTheDocument();
    expect(screen.getByText("translation function")).toBeInTheDocument();
    expect(screen.getByText("成长亮点")).toBeInTheDocument();
    expect(screen.getByText("表达与词汇资产")).toBeInTheDocument();
    expect(screen.getByText("企业买家 · 应用场景说明")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "近 30 天" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/review-analytics?range=30d",
      );
    });
    expect(await screen.findByText("近 30 天你已经形成更稳定的商务表达。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run:

```bash
npm test -- tests/unit/progress-long-term-review.test.tsx
```

Expected: FAIL because `ProgressView` does not accept or render analytics.

- [ ] **Step 3: Add analytics props and render sections**

Modify `src/features/progress/progress-view.tsx`:

```tsx
import { useState } from "react";
import type { ReviewAnalyticsSnapshot, ReviewAnalyticsRange } from "@/lib/validation/review-analytics";

type ProgressViewProps = {
  progress?: ProgressSummary;
  analytics?: ReviewAnalyticsSnapshot | null;
};
```

Add local state inside `ProgressView`:

```tsx
const [selectedRange, setSelectedRange] = useState<ReviewAnalyticsRange>(
  analytics?.range ?? "7d",
);
const [activeAnalytics, setActiveAnalytics] = useState(analytics ?? null);
const [isRefreshingAnalytics, setIsRefreshingAnalytics] = useState(false);

async function loadAnalytics(range: ReviewAnalyticsRange) {
  setSelectedRange(range);
  setIsRefreshingAnalytics(true);

  try {
    const response = await fetch(`/api/review-analytics?range=${range}`);
    const payload = (await response.json()) as {
      analytics: ReviewAnalyticsSnapshot;
    };
    setActiveAnalytics(payload.analytics);
  } finally {
    setIsRefreshingAnalytics(false);
  }
}
```

Render this section below `PageHeader`:

```tsx
{activeAnalytics ? (
  <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">长期复盘</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {activeAnalytics.summaryZh}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["7d", "近 7 天"],
          ["30d", "近 30 天"],
          ["all", "全部时间"],
        ].map(([range, label]) => (
          <button
            key={range}
            type="button"
            onClick={() => {
              void loadAnalytics(range as ReviewAnalyticsRange);
            }}
            className={
              selectedRange === range
                ? "min-h-10 rounded-md border border-[var(--primary)] bg-[#e7f4f2] px-3 text-sm font-medium text-[var(--primary-strong)]"
                : "min-h-10 rounded-md border border-[var(--border)] px-3 text-sm font-medium"
            }
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={isRefreshingAnalytics}
          onClick={() => {
            void loadAnalytics(selectedRange);
          }}
          className="min-h-10 rounded-md border border-[var(--border)] px-3 text-sm font-medium"
        >
          {isRefreshingAnalytics ? "刷新中..." : "刷新"}
        </button>
      </div>
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-4">
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <p className="text-xs font-semibold uppercase text-[var(--muted)]">训练次数</p>
        <p className="mt-2 text-2xl font-semibold">{activeAnalytics.trainingCount}</p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <p className="text-xs font-semibold uppercase text-[var(--muted)]">复盘覆盖</p>
        <p className="mt-2 text-2xl font-semibold">{activeAnalytics.sourceReviewIds.length}</p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <p className="text-xs font-semibold uppercase text-[var(--muted)]">新增表达</p>
        <p className="mt-2 text-2xl font-semibold">{activeAnalytics.phraseGrowth.newPhraseCount}</p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <p className="text-xs font-semibold uppercase text-[var(--muted)]">生成方式</p>
        <p className="mt-2 text-sm font-semibold">
          {activeAnalytics.aiGenerated ? "AI 长期复盘" : "本地统计"}
        </p>
      </div>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <h3 className="text-base font-semibold">经常犯的错误</h3>
        <div className="mt-3 grid gap-3">
          {activeAnalytics.recurringMistakes.map((mistake) => (
            <article key={mistake.id} className="rounded-md bg-[var(--surface-subtle)] p-3">
              <p className="text-sm font-semibold">{mistake.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {`出现 ${mistake.occurrenceCount} 次，平均严重度 ${mistake.averageSeverity.toFixed(1)}`}
              </p>
              <p className="mt-2 text-sm font-medium">{mistake.recommendedDrill}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <h3 className="text-base font-semibold">成长亮点</h3>
        <div className="mt-3 grid gap-3">
          {activeAnalytics.topGrowthSignals.map((signal) => (
            <article key={signal.id} className="rounded-md bg-[var(--surface-subtle)] p-3">
              <p className="text-sm font-semibold">{signal.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{signal.summaryZh}</p>
            </article>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <h3 className="text-base font-semibold">表达与词汇资产</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeAnalytics.phraseGrowth.vocabularyItems.map((item) => (
            <span
              key={item.term}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-sm"
            >
              {`${item.term} · ${item.chinese}`}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        <h3 className="text-base font-semibold">下一阶段训练计划</h3>
        <p className="mt-3 text-sm font-semibold">{activeAnalytics.nextTrainingPlan.title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {activeAnalytics.nextTrainingPlan.reasonZh}
        </p>
      </div>
    </div>
  </section>
) : null}
```

- [ ] **Step 4: Pass analytics from the page**

Modify `src/app/progress/page.tsx`:

```tsx
import { getOrGenerateReviewAnalytics } from "@/lib/progress/review-analytics-store";
```

Make the page async and pass analytics:

```tsx
export default async function ProgressPage() {
  const recentTrainingCount = listPracticeSessionRecords().length;
  const progress = getProgressSummary(recentTrainingCount);
  const analytics = await getOrGenerateReviewAnalytics({ range: "7d" });

  return (
    <ProgressView
      analytics={analytics}
      progress={
        progress.topWeaknesses.length > 0
          ? progress
          : { ...getDefaultProgressSummary(), recentTrainingCount }
      }
    />
  );
}
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm test -- tests/unit/progress-long-term-review.test.tsx tests/unit/progress-dashboard-milestone9.test.tsx
```

Expected: PASS.

## Task 7: Feed Long-Term Review into Today Recommendation

**Files:**
- Modify: `src/lib/recommendations/today-recommendation.ts`
- Modify: `src/app/api/today-recommendation/route.ts`
- Test: `tests/unit/today-recommendation.test.ts`

- [ ] **Step 1: Add failing recommendation test**

Append this test to `tests/unit/today-recommendation.test.ts`:

```ts
it("includes long-term review analytics in the recommendation prompt", async () => {
  generateTextJSONMock.mockResolvedValueOnce({
    title: "技术负责人 · 隐私与部署推进",
    reason:
      "长期复盘显示部署和隐私回答仍然偏长，今天适合练短回答。",
    goalId: "privacy_security",
    personaId: "technical_lead",
    voicePackId: "charon-informative",
    materialMode: "memory_context",
    focusTags: ["隐私安全", "部署推进"],
    estimatedMinutes: 8,
  });

  const recommendation = await generateTodayRecommendation({
    scenarioPack: defaultScenarioPack,
    memories: [],
    weaknesses: [],
    recentSessions: [],
    analytics: {
      id: "review_analytics_7d",
      range: "7d",
      generatedAt: "2026-05-24T09:00:00.000Z",
      staleAfter: "2026-05-24T23:59:59.999Z",
      sourceReviewIds: ["review_1", "review_2"],
      sourceSessionIds: ["session_1", "session_2"],
      trainingCount: 2,
      summaryZh: "隐私和部署回答仍然偏长。",
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
        title: "技术负责人 · 隐私与部署推进",
        reasonZh: "长期复盘建议练短回答。",
        goalId: "privacy_security",
        mode: "objection_challenge",
        personaId: "technical_lead",
        voicePackId: "charon-informative",
        materialMode: "memory_context",
        focusTags: ["隐私安全", "部署推进"],
        estimatedMinutes: 8,
      },
      aiGenerated: true,
    },
  });

  const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
  expect(prompt).toContain("长期复盘");
  expect(prompt).toContain("隐私和部署回答仍然偏长");
  expect(prompt).toContain("技术负责人 · 隐私与部署推进");
  expect(recommendation.personaId).toBe("technical_lead");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/today-recommendation.test.ts
```

Expected: FAIL because `generateTodayRecommendation` does not accept `analytics`.

- [ ] **Step 3: Extend recommendation input**

Modify `src/lib/recommendations/today-recommendation.ts`:

```ts
import type { ReviewAnalyticsSnapshot } from "@/lib/validation/review-analytics";
```

Add to input type:

```ts
analytics?: ReviewAnalyticsSnapshot | null;
```

Add helper:

```ts
function formatReviewAnalytics(analytics?: ReviewAnalyticsSnapshot | null) {
  if (!analytics) {
    return "No long-term review analytics available yet.";
  }

  return [
    `长期复盘范围: ${analytics.range}`,
    `长期复盘总结: ${analytics.summaryZh}`,
    `长期推荐训练: ${analytics.nextTrainingPlan.title}`,
    `推荐原因: ${analytics.nextTrainingPlan.reasonZh}`,
    `推荐重点: ${analytics.nextTrainingPlan.focusTags.join(", ")}`,
  ].join("\n");
}
```

Include this in the prompt:

```ts
长期复盘:
${formatReviewAnalytics(input.analytics)}
```

- [ ] **Step 4: Pass analytics from the API route**

Modify `src/app/api/today-recommendation/route.ts`:

```ts
import { getCachedReviewAnalytics } from "@/lib/progress/review-analytics-store";
```

Pass cached analytics:

```ts
analytics: getCachedReviewAnalytics("7d"),
```

- [ ] **Step 5: Run recommendation tests**

Run:

```bash
npm test -- tests/unit/today-recommendation.test.ts tests/api/today-recommendation.test.ts
```

Expected: PASS.

## Task 8: Verification and Build

**Files:**
- No new files unless previous tasks reveal a necessary fixture update.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- \
  tests/unit/review-analytics-validation.test.ts \
  tests/unit/review-analytics.test.ts \
  tests/unit/long-term-review-generation.test.ts \
  tests/api/review-analytics.test.ts \
  tests/unit/progress-long-term-review.test.tsx \
  tests/unit/review-memory-consolidation.test.ts \
  tests/unit/today-recommendation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run regression tests**

Run:

```bash
npm test -- \
  tests/unit/review-view.test.tsx \
  tests/unit/memory-center.test.tsx \
  tests/unit/progress-dashboard-milestone9.test.tsx \
  tests/api/weakness-tracker.test.ts \
  tests/api/base-routes.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no ESLint errors.

- [ ] **Step 5: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Run production build**

Run:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 7: Smoke test local page**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/progress
```

Expected:

- 页面显示“长期复盘”。
- 默认选中“近 7 天”。
- 点击“近 30 天”会切换并加载对应复盘。
- 页面仍显示旧的“主要弱项”“历史记录”模块。

## Self-Review Checklist

- SDD coverage: every Phase 2 requirement maps to at least one task.
- No unsupported Supabase migration is included.
- DeepSeek is only used for offline text analysis.
- Gemini realtime path is not touched.
- All new behavior starts with failing tests.
- New schema names are consistent across validation, AI, API, and UI.
- Long-term analytics has deterministic fallback when AI fails.
