# 复盘会话回放与逐轮分析 TDD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a review experience where users can select a past AI conversation, inspect the full transcript, click each turn, and see turn-level coaching while preserving all existing review, phrasebook, memory, and long-term analytics features.

**Architecture:** Extend the existing `Review.payload` contract with `conversationReview` instead of adding new database tables. Fetch `PracticeSession` and `TranscriptTurn[]` alongside each review detail page, then render a new conversation replay workspace above the existing sentence review and scorecard modules.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Prisma-backed stores, Vitest, Testing Library, existing DeepSeek text-analysis wrapper, existing Supabase Auth/user scoping.

---

## File Map

- Modify `src/lib/validation/reviews.ts`: add Zod schemas/types for `conversationReview`, turn analysis, issue analysis, stage map, and overall flow.
- Modify `src/lib/ai/review.ts`: update mock review and DeepSeek prompt so every new review includes grounded conversation analysis.
- Modify `src/app/(app)/reviews/[reviewId]/page.tsx`: fetch `PracticeSession` and `TranscriptTurn[]` for the review and pass them to the UI.
- Modify `src/features/reviews/review-view.tsx`: accept session/transcript props and place conversation replay near the top of the page.
- Create `src/features/reviews/conversation-replay-panel.tsx`: render transcript timeline, selected turn detail, filters, and empty/legacy states.
- Create `src/features/reviews/conversation-stage-map.tsx`: render meeting flow stages and related turn links.
- Modify `src/features/progress/progress-view.tsx`: make review history a first-class practice-record list.
- Modify `src/app/(app)/progress/page.tsx`: enrich `reviewHistory` with session metadata and transcript count/duration.
- Add/modify tests:
  - `tests/unit/api-validation.test.ts`
  - `tests/unit/review-generation.test.ts`
  - `tests/unit/review-view.test.tsx`
  - `tests/unit/progress-long-term-review.test.tsx`
  - `tests/api/practice-review.test.ts`

## Task 1: Extend Review Validation Contract

**Files:**
- Modify: `src/lib/validation/reviews.ts`
- Test: `tests/unit/api-validation.test.ts`

- [ ] **Step 1: Write the failing validation test**

Add this test to `tests/unit/api-validation.test.ts`:

```ts
import { createReviewInputSchema } from "@/lib/validation/reviews";

it("accepts conversation replay analysis linked to transcript turns", () => {
  const parsed = createReviewInputSchema.parse({
    meetingOutcome: {
      summary: "The learner handled the meeting but needs stronger discovery.",
      customerReaction: "Interested and asking for workflow proof.",
      nextStep: "Practice a scenario discovery follow-up.",
    },
    scores: {
      clarity: { score: 4, rationale: "Clear enough." },
      businessConfidence: { score: 3, rationale: "Needs stronger framing." },
      discoverySkill: { score: 2, rationale: "Missed the customer intent." },
      productPositioning: { score: 4, rationale: "Relevant positioning." },
      objectionHandling: { score: 3, rationale: "Safe but incomplete." },
      englishNaturalness: { score: 3, rationale: "Understandable." },
    },
    topImprovements: ["Ask one scenario question before pitching."],
    bestMoments: ["Connected Rokid to meeting flow."],
    sentenceReviews: [],
    sentenceUpgrades: [],
    conversationReview: {
      summaryZh: "本次对话能介绍产品价值，但对客户场景确认不足。",
      turns: [
        {
          id: "turn_review_ai_1",
          turnId: "turn_ai_1",
          pairedTurnId: "turn_user_1",
          pairIndex: 1,
          speaker: "ai_customer",
          text: "Which customer scenario should we focus on first?",
          translationZh: "我们应该先关注哪个客户场景？",
          timestamp: 4,
          intentZh: "客户想确认讨论范围，避免直接进入泛泛产品介绍。",
          roleInConversationZh: "开场场景确认",
          customerNeedZh: "客户需要一个具体行业或业务流程作为讨论背景。",
          strengths: [],
          issues: [],
          relatedSentenceReviewIds: [],
        },
        {
          id: "turn_review_user_1",
          turnId: "turn_user_1",
          pairedTurnId: "turn_ai_1",
          pairIndex: 1,
          speaker: "user",
          text: "Rokid has translation function and smart glasses.",
          translationZh: "Rokid 有翻译功能和智能眼镜。",
          timestamp: 12,
          intentZh: "用户试图介绍产品功能。",
          roleInConversationZh: "回答客户场景确认",
          answerFit: "partial",
          answerFitReasonZh: "回答介绍了产品，但没有选择具体客户场景。",
          strengths: ["没有编造价格或认证"],
          issues: [
            {
              type: "answer_relevance",
              severity: 4,
              summaryZh: "没有直接回答客户要聚焦哪个场景。",
              evidence: "客户问 customer scenario，但用户回答 product features。",
              suggestionZh: "先选择一个场景，例如制造业远程协作，再介绍功能。",
            },
          ],
          betterResponse: {
            english:
              "Let's focus on a manufacturing maintenance scenario first, where frontline workers need hands-free access to instructions and remote expert support.",
            chinese:
              "我们先聚焦制造业维护场景，一线工作人员需要免提查看指令并获得远程专家支持。",
            reasonZh: "这句话先回答场景，再自然连接 Rokid 的价值。",
          },
          relatedSentenceReviewIds: ["sentence_review_1"],
          phrasebookCandidate: {
            english:
              "Let's focus on a manufacturing maintenance scenario first.",
            chinese: "我们先聚焦制造业维护场景。",
            useCase: "客户要求先确认业务场景时使用。",
            tags: ["review", "conversation-replay", "scenario-discovery"],
          },
        },
      ],
      stages: [
        {
          stage: "scenario_discovery",
          labelZh: "确认客户场景",
          status: "partial",
          evidenceTurnIds: ["turn_ai_1", "turn_user_1"],
          summaryZh: "客户主动要求确认场景，但用户没有完全接住。",
          improvementZh: "下次先明确选择一个业务场景，再介绍产品能力。",
        },
      ],
      overallFlow: {
        answeredCustomerNeedsZh: ["说明了 Rokid 有智能眼镜和翻译能力"],
        missedCustomerNeedsZh: ["没有选择具体客户场景"],
        strongestMomentZh: "回答没有过度承诺。",
        weakestMomentZh: "没有先确认场景，导致产品介绍显得泛。",
        nextConversationStrategyZh:
          "先用一句话选定行业场景，再把功能连接到客户工作流。",
      },
    },
    materialCoverage: { covered: [], missed: [], unclear: [] },
    phrasebookSuggestions: [],
    weaknessUpdates: [],
    memoryCandidates: [],
    nextSessionRecommendation: {
      focus: "应用场景说明",
      drill: "Scenario-first answer drill",
      prompt: "Pick one customer scenario before explaining Rokid.",
    },
  });

  expect(parsed.conversationReview?.turns[1]?.answerFit).toBe("partial");
  expect(parsed.conversationReview?.stages[0]?.stage).toBe(
    "scenario_discovery",
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/api-validation.test.ts
```

Expected: FAIL because `conversationReview` is not part of `createReviewInputSchema`.

- [ ] **Step 3: Add validation schemas**

In `src/lib/validation/reviews.ts`, add schemas near existing review schemas:

```ts
const conversationTurnIssueSchema = z.object({
  type: z.enum([
    "answer_relevance",
    "business_logic",
    "missing_detail",
    "overlong",
    "grammar",
    "word_choice",
    "naturalness",
    "tone",
  ]),
  severity: z.number().int().min(1).max(5),
  summaryZh: nonEmptyString("逐轮问题摘要不能为空"),
  evidence: nonEmptyString("逐轮问题证据不能为空"),
  suggestionZh: nonEmptyString("逐轮问题建议不能为空"),
});

const betterConversationResponseSchema = z.object({
  english: nonEmptyString("推荐英文不能为空"),
  chinese: nonEmptyString("推荐中文不能为空"),
  reasonZh: nonEmptyString("推荐原因不能为空"),
});

const conversationTurnReviewSchema = z.object({
  id: nonEmptyString("逐轮分析 ID 不能为空"),
  turnId: z.string().optional(),
  pairedTurnId: z.string().optional(),
  pairIndex: z.number().int().min(0),
  speaker: z.enum(["ai_customer", "user"]),
  text: nonEmptyString("对话内容不能为空"),
  translationZh: nonEmptyString("中文翻译不能为空"),
  timestamp: z.number().int().min(0),
  intentZh: nonEmptyString("对话意图不能为空"),
  roleInConversationZh: nonEmptyString("对话作用不能为空"),
  customerNeedZh: z.string().optional(),
  answerFit: z.enum(["good", "partial", "missed", "off_topic"]).optional(),
  answerFitReasonZh: z.string().optional(),
  strengths: z.array(z.string().min(1)).default([]),
  issues: z.array(conversationTurnIssueSchema).default([]),
  betterResponse: betterConversationResponseSchema.optional(),
  relatedSentenceReviewIds: z.array(z.string().min(1)).default([]),
  phrasebookCandidate: z
    .object({
      english: nonEmptyString("表达英文不能为空"),
      chinese: nonEmptyString("表达中文不能为空"),
      useCase: nonEmptyString("使用场景不能为空"),
      tags: z.array(z.string().min(1)).default([]),
    })
    .optional(),
});

const conversationStageReviewSchema = z.object({
  stage: z.enum([
    "opening",
    "scenario_discovery",
    "value_positioning",
    "detail_answering",
    "objection_handling",
    "next_step",
  ]),
  labelZh: nonEmptyString("阶段名称不能为空"),
  status: z.enum(["completed", "partial", "missing"]),
  evidenceTurnIds: z.array(z.string().min(1)).default([]),
  summaryZh: nonEmptyString("阶段总结不能为空"),
  improvementZh: nonEmptyString("阶段建议不能为空"),
});

const overallConversationFlowReviewSchema = z.object({
  answeredCustomerNeedsZh: z.array(z.string().min(1)).default([]),
  missedCustomerNeedsZh: z.array(z.string().min(1)).default([]),
  strongestMomentZh: nonEmptyString("最强表现不能为空"),
  weakestMomentZh: nonEmptyString("最弱表现不能为空"),
  nextConversationStrategyZh: nonEmptyString("下一次会谈策略不能为空"),
});

const conversationReviewSchema = z.object({
  summaryZh: nonEmptyString("对话回放总结不能为空"),
  turns: z.array(conversationTurnReviewSchema).default([]),
  stages: z.array(conversationStageReviewSchema).default([]),
  overallFlow: overallConversationFlowReviewSchema,
});
```

Add `conversationReview: conversationReviewSchema.optional()` to `createReviewInputSchema`.

Export types:

```ts
export type ConversationTurnIssue = z.infer<
  typeof conversationTurnIssueSchema
>;
export type ConversationTurnReview = z.infer<
  typeof conversationTurnReviewSchema
>;
export type ConversationStageReview = z.infer<
  typeof conversationStageReviewSchema
>;
export type ConversationReview = z.infer<typeof conversationReviewSchema>;
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
git commit -m "Add conversation review validation"
```

## Task 2: Generate Conversation Review Data

**Files:**
- Modify: `src/lib/ai/review.ts`
- Test: `tests/unit/review-generation.test.ts`

- [ ] **Step 1: Write the failing generation test**

Add this test to `tests/unit/review-generation.test.ts`:

```ts
it("generates conversationReview grounded in the transcript turns", async () => {
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
    transcriptTurns: [
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
    ],
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
  expect(review.conversationReview?.overallFlow.nextConversationStrategyZh).toEqual(
    expect.any(String),
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-generation.test.ts
```

Expected: FAIL because mock review does not produce `conversationReview`.

- [ ] **Step 3: Add mock conversation review builder**

In `src/lib/ai/review.ts`, add helper functions near `generateMockReview`:

```ts
function translationFromMetadata(turn: TranscriptTurnInput) {
  const metadata = turn.metadata as Record<string, unknown> | undefined;
  const translation = metadata?.translationZh ?? metadata?.translation;
  return typeof translation === "string" && translation.trim()
    ? translation.trim()
    : "暂无中文翻译。";
}

function buildMockConversationReview(input: GeneratePracticeReviewInput) {
  const turns = input.transcriptTurns
    .filter((turn) => turn.speaker !== "system")
    .map((turn, index) => {
      const isUser = turn.speaker === "user";
      return {
        id: `conversation_turn_review_${index + 1}`,
        turnId: "id" in turn ? turn.id : undefined,
        pairedTurnId: undefined,
        pairIndex: Math.floor(index / 2) + 1,
        speaker: turn.speaker,
        text: turn.text,
        translationZh: translationFromMetadata(turn),
        timestamp: turn.timestamp,
        intentZh: isUser
          ? "用户正在尝试回应客户问题并介绍 Rokid 价值。"
          : "AI 客户正在确认业务场景、需求或决策条件。",
        roleInConversationZh: isUser ? "用户回答" : "客户提问",
        customerNeedZh: isUser
          ? undefined
          : "客户需要更具体的业务场景、价值证据或下一步安排。",
        answerFit: isUser ? "partial" : undefined,
        answerFitReasonZh: isUser
          ? "回答有产品信息，但还需要更明确连接客户场景。"
          : undefined,
        strengths: isUser ? ["没有编造不确定的产品承诺"] : [],
        issues: isUser
          ? [
              {
                type: "answer_relevance",
                severity: 3,
                summaryZh: "回答需要更直接回应客户刚才的问题。",
                evidence: turn.text,
                suggestionZh: "先回答客户问题，再补充 Rokid 能力。",
              },
            ]
          : [],
        betterResponse: isUser
          ? {
              english:
                "Let's focus on one concrete customer scenario first, then I can explain how Rokid supports that workflow.",
              chinese:
                "我们先聚焦一个具体客户场景，然后我再说明 Rokid 如何支持这个工作流。",
              reasonZh: "这句话先接住客户场景，再自然推进产品价值。",
            }
          : undefined,
        relatedSentenceReviewIds: isUser ? ["sentence_review_value_1"] : [],
      };
    });

  return {
    summaryZh: "本次对话能介绍 Rokid 价值，但需要更先确认客户场景。",
    turns,
    stages: [
      {
        stage: "scenario_discovery",
        labelZh: "确认客户场景",
        status: "partial",
        evidenceTurnIds: turns.map((turn) => turn.turnId).filter(Boolean),
        summaryZh: "客户场景确认已经出现，但回答还可以更具体。",
        improvementZh: "下次先选择一个行业或业务流程，再展开产品能力。",
      },
    ],
    overallFlow: {
      answeredCustomerNeedsZh: ["说明了 Rokid 的产品能力"],
      missedCustomerNeedsZh: ["还需要更具体确认客户业务场景"],
      strongestMomentZh: "没有过度承诺不确定信息。",
      weakestMomentZh: "客户要求聚焦场景时，回答仍偏产品功能。",
      nextConversationStrategyZh:
        "先确认客户场景，再把 Rokid 功能转成客户结果。",
    },
  };
}
```

Include `conversationReview: buildMockConversationReview(input)` in the object returned by `generateMockReview`.

- [ ] **Step 4: Update DeepSeek prompt**

In `buildReviewPrompt`, add these exact requirements:

```ts
"The JSON must also include conversationReview with summaryZh, turns, stages, and overallFlow.",
"conversationReview.turns must include every non-system transcript turn in order.",
"For AI customer turns, explain the customer's intent and what information they wanted from the learner.",
"For user turns, judge whether the answer fits the latest AI customer question using answerFit: good, partial, missed, or off_topic.",
"Each user turn must include answerFitReasonZh, strengths, issues, optional betterResponse, and relatedSentenceReviewIds when relevant.",
"Do not invent a conversation. Ground every conversationReview.turn in the actual Transcript array.",
"If the transcript includes translation metadata, use it. Otherwise provide concise Chinese translation.",
"conversationReview.stages must evaluate opening, scenario_discovery, value_positioning, detail_answering, objection_handling, and next_step when those stages appear or are missing.",
```

Update the existing line listing required JSON fields to include `conversationReview`.

- [ ] **Step 5: Run generation tests**

Run:

```bash
npm test -- tests/unit/review-generation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/review.ts tests/unit/review-generation.test.ts
git commit -m "Generate conversation replay reviews"
```

## Task 3: Fetch Transcript and Session for Review Detail

**Files:**
- Modify: `src/app/(app)/reviews/[reviewId]/page.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write the failing UI prop test**

In `tests/unit/review-view.test.tsx`, add transcript props to the existing render and assert the transcript appears:

```ts
it("renders the saved conversation transcript inside the review page", () => {
  render(
    <ReviewView
      reviewId="review_123"
      sessionId="session_123"
      review={{
        ...review,
        conversationReview: {
          summaryZh: "本次对话围绕客户场景展开。",
          turns: [
            {
              id: "conversation_turn_review_1",
              turnId: "turn_ai_1",
              pairIndex: 1,
              speaker: "ai_customer",
              text: "Which customer scenario should we focus on first?",
              translationZh: "我们应该先关注哪个客户场景？",
              timestamp: 4,
              intentZh: "客户想确认讨论场景。",
              roleInConversationZh: "客户提问",
              customerNeedZh: "客户需要具体行业场景。",
              strengths: [],
              issues: [],
              relatedSentenceReviewIds: [],
            },
          ],
          stages: [],
          overallFlow: {
            answeredCustomerNeedsZh: [],
            missedCustomerNeedsZh: ["没有确认具体场景"],
            strongestMomentZh: "语气礼貌。",
            weakestMomentZh: "没有直接选场景。",
            nextConversationStrategyZh: "先选场景，再讲功能。",
          },
        },
      }}
      transcriptTurns={[
        {
          id: "turn_ai_1",
          sessionId: "session_123",
          speaker: "ai_customer",
          text: "Which customer scenario should we focus on first?",
          timestamp: 4,
          metadata: { translationZh: "我们应该先关注哪个客户场景？" },
          createdAt: "2026-06-01T00:00:00.000Z",
        },
      ]}
    />,
  );

  expect(screen.getByText("完整对话")).toBeInTheDocument();
  expect(
    screen.getByText("Which customer scenario should we focus on first?"),
  ).toBeInTheDocument();
  expect(screen.getByText("客户想确认讨论场景。")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL because `ReviewView` does not accept `transcriptTurns` and does not render `完整对话`.

- [ ] **Step 3: Extend ReviewView props**

In `src/features/reviews/review-view.tsx`, import `TranscriptTurnRecord`:

```ts
import type { TranscriptTurnRecord } from "@/lib/practice/practice-session-store";
```

Update props:

```ts
type ReviewViewProps = {
  reviewId: string;
  sessionId: string;
  review: PracticeReviewPayload;
  transcriptTurns?: TranscriptTurnRecord[];
};
```

Update function signature:

```ts
export function ReviewView({
  reviewId,
  sessionId,
  review,
  transcriptTurns = [],
}: ReviewViewProps) {
```

Add placeholder render before `SentenceReviewPanel`:

```tsx
<section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
  <h2 className="text-lg font-semibold">完整对话</h2>
  <div className="mt-4 grid gap-3">
    {transcriptTurns.length > 0 ? (
      transcriptTurns.map((turn) => (
        <article
          key={turn.id}
          className="rounded-md border border-[var(--border)] bg-white p-4"
        >
          <p className="text-xs font-semibold text-[var(--primary)]">
            {turn.speaker === "user" ? "你" : "AI 客户"}
          </p>
          <p className="mt-2 text-sm font-medium leading-6">{turn.text}</p>
        </article>
      ))
    ) : (
      <p className="text-sm text-[var(--muted)]">
        该练习暂未保存完整对话记录。
      </p>
    )}
  </div>
</section>
```

- [ ] **Step 4: Fetch transcript in review page**

In `src/app/(app)/reviews/[reviewId]/page.tsx`, import:

```ts
import {
  ensurePracticeSessionRecord,
  getPracticeSessionRecordAsync,
  getReviewRecordAsync,
  getTranscriptTurnsAsync,
} from "@/lib/practice/practice-session-store";
```

After `review` is resolved:

```ts
const sessionId = storedReview?.sessionId ?? fallbackSession.id;
const [practiceSession, transcriptTurns] = await Promise.all([
  getPracticeSessionRecordAsync(sessionId, { userId: authContext.profileId }),
  getTranscriptTurnsAsync(sessionId, { userId: authContext.profileId }),
]);
```

Pass transcript:

```tsx
<ReviewView
  reviewId={reviewId}
  sessionId={sessionId}
  review={review}
  transcriptTurns={transcriptTurns}
/>
```

- [ ] **Step 5: Run test**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(app)/reviews/[reviewId]/page.tsx' src/features/reviews/review-view.tsx tests/unit/review-view.test.tsx
git commit -m "Show saved transcript in review detail"
```

## Task 4: Build Conversation Replay Component

**Files:**
- Create: `src/features/reviews/conversation-replay-panel.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing interaction test**

Add this test:

```ts
it("lets the user select a transcript turn and inspect turn-level coaching", () => {
  render(
    <ReviewView
      reviewId="review_123"
      sessionId="session_123"
      review={{
        ...review,
        conversationReview: {
          summaryZh: "本次对话需要更先确认客户场景。",
          turns: [
            {
              id: "conversation_turn_review_user_1",
              turnId: "turn_user_1",
              pairIndex: 1,
              speaker: "user",
              text: "Rokid has translation function and smart glasses.",
              translationZh: "Rokid 有翻译功能和智能眼镜。",
              timestamp: 12,
              intentZh: "用户试图介绍产品功能。",
              roleInConversationZh: "用户回答",
              answerFit: "partial",
              answerFitReasonZh: "回答介绍了功能，但没有选择客户场景。",
              strengths: ["没有编造不确定信息"],
              issues: [
                {
                  type: "answer_relevance",
                  severity: 4,
                  summaryZh: "没有直接回答客户要聚焦哪个场景。",
                  evidence: "客户问 scenario，用户回答 function。",
                  suggestionZh: "先选择制造业维护场景，再解释功能。",
                },
              ],
              betterResponse: {
                english:
                  "Let's focus on a manufacturing maintenance scenario first.",
                chinese: "我们先聚焦制造业维护场景。",
                reasonZh: "先回答场景，再展开产品价值。",
              },
              relatedSentenceReviewIds: ["sentence_review_1"],
            },
          ],
          stages: [],
          overallFlow: {
            answeredCustomerNeedsZh: [],
            missedCustomerNeedsZh: ["没有选择具体客户场景"],
            strongestMomentZh: "语气安全。",
            weakestMomentZh: "没有回答场景选择。",
            nextConversationStrategyZh: "先选场景，再讲功能。",
          },
        },
      }}
      transcriptTurns={[
        {
          id: "turn_user_1",
          sessionId: "session_123",
          speaker: "user",
          text: "Rokid has translation function and smart glasses.",
          timestamp: 12,
          metadata: { translationZh: "Rokid 有翻译功能和智能眼镜。" },
          createdAt: "2026-06-01T00:00:00.000Z",
        },
      ]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: /Rokid has translation function and smart glasses/,
    }),
  );

  expect(screen.getByText("回答匹配度")).toBeInTheDocument();
  expect(screen.getByText("部分回答")).toBeInTheDocument();
  expect(screen.getByText("没有直接回答客户要聚焦哪个场景。")).toBeInTheDocument();
  expect(
    screen.getByText("Let's focus on a manufacturing maintenance scenario first."),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL because there is no interactive replay component.

- [ ] **Step 3: Create component**

Create `src/features/reviews/conversation-replay-panel.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { TranscriptTurnRecord } from "@/lib/practice/practice-session-store";
import type { ConversationTurnReview, PracticeReviewPayload } from "@/lib/validation/reviews";

type ConversationReplayPanelProps = {
  review: PracticeReviewPayload;
  transcriptTurns: TranscriptTurnRecord[];
};

const answerFitLabels: Record<string, string> = {
  good: "回答到位",
  partial: "部分回答",
  missed: "没有答到",
  off_topic: "跑题",
};

function translationFromTurn(turn: TranscriptTurnRecord) {
  const translation =
    (turn.metadata as Record<string, unknown>).translationZh ??
    (turn.metadata as Record<string, unknown>).translation;
  return typeof translation === "string" && translation.trim()
    ? translation.trim()
    : "";
}

function findAnalysis(
  analyses: ConversationTurnReview[],
  turn: TranscriptTurnRecord,
) {
  return analyses.find((analysis) => analysis.turnId === turn.id);
}

export function ConversationReplayPanel({
  review,
  transcriptTurns,
}: ConversationReplayPanelProps) {
  const analyses = review.conversationReview?.turns ?? [];
  const visibleTurns = transcriptTurns.filter(
    (turn) => turn.speaker !== "system",
  );
  const [selectedTurnId, setSelectedTurnId] = useState(
    visibleTurns[0]?.id ?? analyses[0]?.turnId ?? "",
  );
  const selectedTurn = visibleTurns.find((turn) => turn.id === selectedTurnId);
  const selectedAnalysis = selectedTurn
    ? findAnalysis(analyses, selectedTurn)
    : analyses[0];
  const summary = review.conversationReview?.summaryZh;

  const hasConversation = visibleTurns.length > 0 || analyses.length > 0;

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <MessageSquareText
          className="h-5 w-5 text-[var(--primary)]"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold">完整对话</h2>
      </div>
      {summary ? (
        <p className="mt-3 rounded-md bg-[var(--surface-subtle)] p-3 text-sm leading-6 text-[var(--muted)]">
          {summary}
        </p>
      ) : null}
      {!hasConversation ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          该练习暂未保存完整对话记录。
        </p>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <div className="grid gap-3">
            {visibleTurns.map((turn) => {
              const analysis = findAnalysis(analyses, turn);
              return (
                <button
                  key={turn.id}
                  type="button"
                  onClick={() => setSelectedTurnId(turn.id)}
                  className={`rounded-md border p-4 text-left transition ${
                    selectedTurnId === turn.id
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[var(--primary)]">
                      {turn.speaker === "user" ? "你" : "AI 客户"}
                    </p>
                    {analysis ? <StatusPill tone="success">有分析</StatusPill> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6">{turn.text}</p>
                  {translationFromTurn(turn) ? (
                    <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                      {translationFromTurn(turn)}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
          <aside className="rounded-md border border-[var(--border)] bg-white p-4">
            {selectedAnalysis ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    这句话的作用
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {selectedAnalysis.intentZh}
                  </p>
                </div>
                {selectedAnalysis.answerFit ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                      回答匹配度
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {answerFitLabels[selectedAnalysis.answerFit]}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {selectedAnalysis.answerFitReasonZh}
                    </p>
                  </div>
                ) : null}
                {selectedAnalysis.issues.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                      需要改进
                    </p>
                    <div className="mt-2 grid gap-2">
                      {selectedAnalysis.issues.map((issue) => (
                        <div
                          key={`${issue.type}-${issue.evidence}`}
                          className="rounded-md bg-[var(--surface-subtle)] p-3 text-sm leading-6"
                        >
                          <p className="font-semibold">{issue.summaryZh}</p>
                          <p className="mt-1 text-[var(--muted)]">
                            {issue.suggestionZh}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedAnalysis.betterResponse ? (
                  <div className="rounded-md border border-[#b7d8d6] bg-[#f2faf8] p-3">
                    <p className="text-xs font-semibold text-[var(--primary)]">
                      更好的说法
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {selectedAnalysis.betterResponse.english}
                    </p>
                    <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm leading-6 text-[var(--muted)]">
                      {selectedAnalysis.betterResponse.chinese}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                      {selectedAnalysis.betterResponse.reasonZh}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                该历史复盘没有逐轮分析，可重新生成复盘获得详细教练批注。
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Use component in ReviewView**

Replace the placeholder `完整对话` section in `ReviewView` with:

```tsx
<ConversationReplayPanel review={review} transcriptTurns={transcriptTurns} />
```

Import:

```ts
import { ConversationReplayPanel } from "@/features/reviews/conversation-replay-panel";
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/reviews/conversation-replay-panel.tsx src/features/reviews/review-view.tsx tests/unit/review-view.test.tsx
git commit -m "Add interactive review conversation replay"
```

## Task 5: Add Conversation Stage Map

**Files:**
- Create: `src/features/reviews/conversation-stage-map.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Test: `tests/unit/review-view.test.tsx`

- [ ] **Step 1: Write failing stage map test**

Add:

```ts
it("renders conversation stage coverage from the review", () => {
  render(
    <ReviewView
      reviewId="review_123"
      sessionId="session_123"
      review={{
        ...review,
        conversationReview: {
          summaryZh: "本次会谈流程有缺口。",
          turns: [],
          stages: [
            {
              stage: "opening",
              labelZh: "开场寒暄",
              status: "completed",
              evidenceTurnIds: ["turn_ai_1"],
              summaryZh: "开场礼貌自然。",
              improvementZh: "保持简洁。",
            },
            {
              stage: "next_step",
              labelZh: "推进下一步",
              status: "missing",
              evidenceTurnIds: [],
              summaryZh: "没有明确下一步。",
              improvementZh: "用一句话约定试点或技术评审。",
            },
          ],
          overallFlow: {
            answeredCustomerNeedsZh: ["介绍了价值"],
            missedCustomerNeedsZh: ["没有推进下一步"],
            strongestMomentZh: "开场自然。",
            weakestMomentZh: "收尾缺少行动。",
            nextConversationStrategyZh: "每个回答用下一步收尾。",
          },
        },
      }}
      transcriptTurns={[]}
    />,
  );

  expect(screen.getByText("会谈流程地图")).toBeInTheDocument();
  expect(screen.getByText("开场寒暄")).toBeInTheDocument();
  expect(screen.getByText("推进下一步")).toBeInTheDocument();
  expect(screen.getByText("缺失")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create stage map component**

Create `src/features/reviews/conversation-stage-map.tsx`:

```tsx
import { Route } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { ConversationStageReview } from "@/lib/validation/reviews";

type ConversationStageMapProps = {
  stages: ConversationStageReview[];
};

const statusLabels: Record<ConversationStageReview["status"], string> = {
  completed: "完成",
  partial: "部分完成",
  missing: "缺失",
};

const statusTones: Record<
  ConversationStageReview["status"],
  "success" | "warning" | "danger"
> = {
  completed: "success",
  partial: "warning",
  missing: "danger",
};

export function ConversationStageMap({ stages }: ConversationStageMapProps) {
  if (stages.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <Route className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">会谈流程地图</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => (
          <article
            key={stage.stage}
            className="rounded-md border border-[var(--border)] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{stage.labelZh}</h3>
              <StatusPill tone={statusTones[stage.status]}>
                {statusLabels[stage.status]}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {stage.summaryZh}
            </p>
            <p className="mt-2 rounded-md bg-[var(--surface-subtle)] p-3 text-sm leading-6 text-[var(--foreground)]">
              {stage.improvementZh}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Use it in ReviewView**

Import and render after `ConversationReplayPanel`:

```tsx
<ConversationStageMap stages={review.conversationReview?.stages ?? []} />
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/reviews/conversation-stage-map.tsx src/features/reviews/review-view.tsx tests/unit/review-view.test.tsx
git commit -m "Add review conversation stage map"
```

## Task 6: Make Review History a Real Practice Record List

**Files:**
- Modify: `src/app/(app)/progress/page.tsx`
- Modify: `src/features/progress/progress-view.tsx`
- Test: `tests/unit/progress-long-term-review.test.tsx`

- [ ] **Step 1: Write failing review history test**

Add to `tests/unit/progress-long-term-review.test.tsx`:

```ts
it("shows selectable practice records with session context", () => {
  render(
    <ProgressView
      analytics={null}
      reviewHistory={[
        {
          id: "review_123",
          sessionId: "session_123",
          createdAt: "2026-06-01T09:00:00.000Z",
          summary: "The learner needs stronger scenario discovery.",
          goalLabel: "应用场景说明",
          personaLabel: "企业买家",
          voicePackLabel: "Kore 坚定专业",
          materialModeLabel: "系统记忆",
          turnCount: 8,
          durationMinutes: 7,
          status: "已生成复盘",
        },
      ]}
    />,
  );

  expect(screen.getByText("练习记录")).toBeInTheDocument();
  expect(screen.getByText("应用场景说明")).toBeInTheDocument();
  expect(screen.getByText("企业买家")).toBeInTheDocument();
  expect(screen.getByText("8 轮")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /查看复盘/ })).toHaveAttribute(
    "href",
    "/reviews/review_123",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/progress-long-term-review.test.tsx
```

Expected: FAIL because `reviewHistory` type and UI do not include these fields.

- [ ] **Step 3: Extend ProgressView review history type**

In `src/features/progress/progress-view.tsx`, update the `reviewHistory` type:

```ts
reviewHistory?: Array<{
  createdAt: string;
  durationMinutes?: number;
  goalLabel?: string;
  id: string;
  materialModeLabel?: string;
  personaLabel?: string;
  sessionId: string;
  status?: string;
  summary: string;
  turnCount?: number;
  voicePackLabel?: string;
}>;
```

- [ ] **Step 4: Add Review History section**

Place this section above the current long-term analytics section:

```tsx
<section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
  <div className="flex items-center gap-2">
    <History className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
    <h2 className="text-lg font-semibold">练习记录</h2>
  </div>
  <div className="mt-4 grid gap-3">
    {reviewHistory.length > 0 ? (
      reviewHistory.map((review) => (
        <article
          key={review.id}
          className="rounded-md border border-[var(--border)] bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--primary)]">
                {new Date(review.createdAt).toLocaleString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                {review.goalLabel ?? "练习复盘"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {review.summary}
              </p>
            </div>
            <Link
              href={`/reviews/${review.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
            >
              查看复盘
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <dl className="mt-4 grid gap-2 md:grid-cols-4">
            <div className="rounded-md bg-[var(--surface-subtle)] p-3">
              <dt className="text-xs text-[var(--muted)]">AI 客户角色</dt>
              <dd className="mt-1 text-sm font-semibold">
                {review.personaLabel ?? "未记录"}
              </dd>
            </div>
            <div className="rounded-md bg-[var(--surface-subtle)] p-3">
              <dt className="text-xs text-[var(--muted)]">AI Studio 音色</dt>
              <dd className="mt-1 text-sm font-semibold">
                {review.voicePackLabel ?? "未记录"}
              </dd>
            </div>
            <div className="rounded-md bg-[var(--surface-subtle)] p-3">
              <dt className="text-xs text-[var(--muted)]">对话轮数</dt>
              <dd className="mt-1 text-sm font-semibold">
                {review.turnCount ? `${review.turnCount} 轮` : "未记录"}
              </dd>
            </div>
            <div className="rounded-md bg-[var(--surface-subtle)] p-3">
              <dt className="text-xs text-[var(--muted)]">时长</dt>
              <dd className="mt-1 text-sm font-semibold">
                {review.durationMinutes ? `${review.durationMinutes} 分钟` : "未记录"}
              </dd>
            </div>
          </dl>
        </article>
      ))
    ) : (
      <p className="text-sm leading-6 text-[var(--muted)]">
        完成一次练习后，这里会显示可回看的复盘记录。
      </p>
    )}
  </div>
</section>
```

- [ ] **Step 5: Enrich data in progress page**

In `src/app/(app)/progress/page.tsx`, create label helpers using existing `scenario-packs`, `personas`, and `voice-packs` data sources. If a label cannot be resolved, use raw ids.

Pass:

```ts
reviewHistory={reviewRecords.map((review) => {
  const session = practiceSessions.find(
    (practiceSession) => practiceSession.id === review.sessionId,
  );
  return {
    id: review.id,
    sessionId: review.sessionId,
    createdAt: review.createdAt,
    summary: review.meetingOutcome.summary,
    goalLabel: resolvePracticeGoalLabel(session?.goalId),
    personaLabel: resolvePersonaLabel(session?.personaId),
    voicePackLabel: resolveVoicePackLabel(session?.voicePackId),
    materialModeLabel: resolveMaterialModeLabel(session?.materialMode),
    turnCount: review.conversationReview?.turns.length,
    durationMinutes: estimateDurationMinutes(session?.startedAt, session?.endedAt),
    status: "已生成复盘",
  };
})}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- tests/unit/progress-long-term-review.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(app)/progress/page.tsx' src/features/progress/progress-view.tsx tests/unit/progress-long-term-review.test.tsx
git commit -m "Add selectable review history records"
```

## Task 7: API Integration and Persistence Verification

**Files:**
- Modify: `tests/api/practice-review.test.ts`

- [ ] **Step 1: Write failing API test**

Add:

```ts
it("persists generated conversationReview with the practice review", async () => {
  const session = savePracticeSessionRecord({
    userId: "user_test",
    scenarioPackId: "rokid-overseas-sales",
    goalId: "application_scenarios",
    mode: "customer_qa",
    personaId: "enterprise_buyer",
    voicePackId: "kore-firm",
    difficulty: "normal",
    trainingFocus: ["应用场景说明"],
    focusTags: ["应用场景"],
  });

  await saveTranscript(
    jsonRequest({
      turns: [
        {
          speaker: "ai_customer",
          text: "Which customer scenario should we focus on first?",
          timestamp: 4,
          metadata: { translationZh: "我们应该先关注哪个客户场景？" },
        },
        {
          speaker: "user",
          text: "Rokid has translation function and smart glasses.",
          timestamp: 12,
          metadata: { translationZh: "Rokid 有翻译功能和智能眼镜。" },
        },
      ],
    }),
    routeContext(session.id),
  );

  const response = await createReview(jsonRequest(), routeContext(session.id));
  const payload = (await response.json()) as {
    review: PracticeReviewPayload & { id: string };
  };

  expect(response.status).toBe(201);
  expect(payload.review.conversationReview?.turns.length).toBeGreaterThan(0);
  expect(payload.review.conversationReview?.turns[0]?.text).toContain(
    "Which customer scenario",
  );
});
```

- [ ] **Step 2: Run API test**

Run:

```bash
npm test -- tests/api/practice-review.test.ts
```

Expected: PASS after Tasks 1-2. If it fails, fix `generatePracticeReview` or `saveReviewRecordAsync` so `payload` includes `conversationReview`.

- [ ] **Step 3: Commit**

```bash
git add tests/api/practice-review.test.ts
git commit -m "Verify conversation review persistence"
```

## Task 8: Final Verification

**Files:**
- No new files unless previous tasks reveal failures.

- [ ] **Step 1: Run targeted tests**

```bash
npm test -- tests/unit/api-validation.test.ts
npm test -- tests/unit/review-generation.test.ts
npm test -- tests/unit/review-view.test.tsx
npm test -- tests/unit/progress-long-term-review.test.tsx
npm test -- tests/api/practice-review.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run full suite**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 3: Manual smoke test**

Run local app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/progress
```

Manual checks:

- 复盘首页 shows 练习记录.
- Clicking 查看复盘 opens `/reviews/[reviewId]`.
- 复盘详情 shows 完整对话.
- Clicking a turn changes the detail panel.
- Existing sections still show: 30秒复盘结论、逐句精修、商务评分卡、表达库建议、可沉淀记忆、下一次练习建议.

- [ ] **Step 4: Commit final polish if needed**

```bash
git status --short
git add src lib tests docs
git commit -m "Polish conversation replay review experience"
```

## Self-Review Checklist

- Every new feature starts with a failing test.
- `conversationReview` is optional for historical compatibility.
- Existing `sentenceReviews`, `sentenceUpgrades`, `phrasebookSuggestions`, `memoryCandidates`, `weaknessUpdates`, and long-term analytics stay intact.
- The review page fetches transcript data with the current user's scope.
- The UI handles empty transcript and old review payloads.
- No fallback fake analysis is shown when `conversationReview` is absent.
- Full verification commands are specified.
