# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing Rokid English meeting coach frontend around a clear daily practice loop, call-like realtime room, customer material memory, review-driven learning, phrase practice, and scenario-pack extensibility.

**Architecture:** Keep the current Next.js App Router routes and API surface where possible, but add a local scenario-pack configuration layer first so new UI copy, personas, voice packs, phrase categories, review rubrics, and practice goals are not hardcoded in page components. Implement the redesign as milestone-sized vertical slices with focused React components, local stores where backend persistence is not ready, and tests that lock the new interaction model before visual polish.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, React Testing Library, Playwright, Zod, existing DeepSeek text client, existing Gemini Live websocket relay.

---

## 0. Scope And Execution Rules

This is a frontend and product-experience redesign plan based on `docs/frontend-redesign-prd.zh-CN.md`.

Do not rewrite the whole app in one pass. Each milestone should leave the app runnable and testable.

Execution rules:

- [ ] Work on the current branch unless the user requests a new branch.
- [ ] Keep `docs/user-manual.zh-CN.md` uncommitted unless the user asks to include it.
- [ ] Use small commits after each milestone.
- [ ] Do not commit `.env`, uploaded files, transcripts with real customer data, or API keys.
- [ ] Preserve existing routes unless this plan explicitly adds a route.
- [ ] Prefer config-driven copy for Rokid-specific terms.
- [ ] After every milestone run `npm run typecheck`.
- [ ] After every UI milestone run the relevant unit tests.
- [ ] Before declaring the full redesign complete run `npm run build` and `npm run e2e`.

Recommended commit sequence:

```bash
git commit -m "feat: add scenario pack config"
git commit -m "feat: simplify primary navigation"
git commit -m "feat: redesign today practice dashboard"
git commit -m "feat: add guided practice wizard"
git commit -m "feat: redesign realtime practice room"
git commit -m "feat: turn materials into prep station"
git commit -m "feat: redesign practice review flow"
git commit -m "feat: make phrasebook practice oriented"
git commit -m "feat: add memory center"
git commit -m "feat: connect redesign prompts to text analysis"
git commit -m "test: add responsive smoke coverage"
```

## 1. Target File Map

### 1.1 New Files

- Create: `src/data/scenario-packs.ts`
  - Owns `ScenarioPack`, `PracticeGoal`, `Persona`, `VoicePack`, phrase categories, review rubric, and the default Rokid scenario.
- Create: `src/lib/scenarios/current-scenario.ts`
  - Provides helpers for reading the active scenario pack and config sections.
- Create: `src/lib/recommendations/today-recommendation.ts`
  - Builds the Today Practice recommendation from scenario config, materials, progress, and fallback rules.
- Create: `src/lib/memory/memory-store.ts`
  - Provides mock-first memory CRUD and ranking while Supabase schema is not finalized.
- Create: `src/lib/validation/memory.ts`
  - Defines Zod schemas for memory items, memory candidates, and memory updates.
- Create: `src/features/dashboard/today-practice-card.tsx`
  - Renders the single primary CTA card on `/dashboard`.
- Create: `src/features/dashboard/quick-action-strip.tsx`
  - Renders the three secondary actions.
- Create: `src/features/practice/practice-wizard.tsx`
  - Replaces the heavy setup form with the 3-step guided flow.
- Create: `src/features/practice/voice-pack-selector.tsx`
  - Renders predefined voice packs with gender, personality, style, speed, and scenario fit.
- Create: `src/features/practice/conversation-transcript-panel.tsx`
  - Handles default English-only subtitle module and expandable full transcript module.
- Create: `src/features/reviews/review-summary-card.tsx`
  - Shows the 30-second review conclusion.
- Create: `src/features/reviews/memory-candidates.tsx`
  - Shows memory candidates with save all, edit, and reject actions.
- Create: `src/features/phrasebook/daily-phrase-practice.tsx`
  - Renders today’s 5 phrases and “练这句” flow.
- Create: `src/features/memory/memory-center-view.tsx`
  - Renders the memory center under the review module.
- Create: `src/app/memory/page.tsx`
  - Route for memory center. It can also be linked from `/progress`.
- Create: `src/app/api/memories/route.ts`
  - Mock-first memory list and create route.
- Create: `src/app/api/memories/[memoryId]/route.ts`
  - Mock-first memory update and delete route.
- Create: `tests/unit/scenario-packs.test.ts`
  - Locks scenario pack shape, voice packs, and phrase categories.
- Create: `tests/unit/today-recommendation.test.ts`
  - Locks daily recommendation fallback behavior.
- Create: `tests/unit/practice-wizard.test.tsx`
  - Locks 3-step setup behavior and voice pack selection.
- Create: `tests/unit/transcript-panel.test.tsx`
  - Locks default and expanded subtitle behavior.
- Create: `tests/unit/memory-center.test.tsx`
  - Locks memory center controls.
- Create: `tests/api/memories.test.ts`
  - Locks memory API behavior.
- Create: `tests/e2e/redesign-smoke.spec.ts`
  - Verifies the redesigned core loop in browser.

### 1.2 Modified Files

- Modify: `src/components/app-sidebar.tsx`
  - Collapse primary navigation to 今日练习 / 客户材料 / 表达库 / 复盘.
- Modify: `src/components/page-header.tsx`
  - Support simpler page headers with one primary action and restrained supporting text.
- Modify: `src/features/dashboard/dashboard-view.tsx`
  - Replace dashboard-like layout with 今日练习.
- Modify: `src/features/practice/practice-setup.tsx`
  - Either wrap the new wizard or retire the old form from the visible flow.
- Modify: `src/features/practice/practice-view.tsx`
  - Point `/practice` to the wizard and route user to sessions.
- Modify: `src/features/practice/realtime-room.tsx`
  - Use call-like state, voice pack context, transcript panel, and persistent end-review action.
- Modify: `src/features/practice/live-meeting-panel.tsx`
  - Simplify live state labels and controls.
- Modify: `src/features/practice/smart-support-panel.tsx`
  - Convert hints into short bilingual cue cards.
- Modify: `src/features/materials/materials-view.tsx`
  - Make materials a prep station rather than a file library.
- Modify: `src/features/materials/material-list.tsx`
  - Add material memory status and direct practice action.
- Modify: `src/features/materials/material-brief-view.tsx`
  - Add application scenarios, pros/cons, competitor differences, and product parameter sections.
- Modify: `src/features/reviews/review-view.tsx`
  - Lead with 30-second conclusion and tabs.
- Modify: `src/features/reviews/sentence-upgrade-table.tsx`
  - Support `needs_upgrade` and `already_natural`.
- Modify: `src/features/phrasebook/phrasebook-view.tsx`
  - Make phrasebook daily-practice oriented and category driven.
- Modify: `src/features/progress/progress-view.tsx`
  - Rename UI to 复盘 and add memory entry point.
- Modify: `src/app/progress/page.tsx`
  - Keep route but title/metadata should read 复盘.
- Modify: `src/lib/validation/reviews.ts`
  - Add sentence upgrade status and memory candidate schema.
- Modify: `src/lib/validation/phrasebook.ts`
  - Add mastery state and expanded Rokid categories.
- Modify: `src/lib/ai/material-brief.ts`
  - Request application scenarios, pros/cons, competitor differences, parameters.
- Modify: `src/lib/ai/review.ts`
  - Request already-natural sentence feedback and memory candidates.
- Modify: `src/lib/ai/realtime.ts`
  - Accept scenario pack, persona, voice pack, material summary, memory context.
- Modify: `src/app/api/practice-sessions/route.ts`
  - Accept wizard payload fields.
- Modify: `src/app/api/practice-sessions/[sessionId]/review/route.ts`
  - Return memory candidates and sentence status.
- Modify: `tests/unit/static-views.test.tsx`
  - Update labels and structure expectations.
- Modify: `tests/unit/realtime-room.test.tsx`
  - Update state and transcript expectations.
- Modify: `tests/unit/review-view.test.tsx`
  - Update review summary, sentence status, memory candidates.
- Modify: `tests/e2e/smoke.spec.ts`
  - Update headings and primary navigation expectations.

## 2. Milestone 0: Baseline Verification

**Outcome:** Know the exact current health of the branch before UI changes.

**Files:**

- Read: `package.json`
- Read: `tests/unit/static-views.test.tsx`
- Read: `tests/e2e/smoke.spec.ts`

- [ ] **Step 0.1: Check current git state**

Run:

```bash
git status --short
```

Expected:

```text
docs/user-manual.zh-CN.md appears as an untracked file
```

If other files appear, inspect them before continuing and avoid reverting user work.

- [ ] **Step 0.2: Run baseline typecheck**

Run:

```bash
npm run typecheck
```

Expected:

```text
no TypeScript errors
```

- [ ] **Step 0.3: Run current unit tests that will be touched first**

Run:

```bash
npm test -- tests/unit/static-views.test.tsx tests/unit/realtime-room.test.tsx tests/unit/review-view.test.tsx
```

Expected:

```text
all selected test files pass
```

- [ ] **Step 0.4: Commit nothing**

There are no code changes in this milestone.

## 3. Milestone 1: Scenario Pack And Voice Pack Foundation

**Outcome:** Rokid content, practice goals, personas, voice packs, phrase categories, and review rubric become config-driven before the visible redesign begins.

**Files:**

- Create: `src/data/scenario-packs.ts`
- Create: `src/lib/scenarios/current-scenario.ts`
- Create: `tests/unit/scenario-packs.test.ts`
- Modify: `src/data/personas.ts`
- Modify: `src/data/seed-phrases.ts`

- [ ] **Step 1.1: Add failing scenario pack tests**

Create `tests/unit/scenario-packs.test.ts` with assertions for:

- `rokid-overseas-sales` exists.
- Primary navigation labels are 今日练习 / 客户材料 / 表达库 / 复盘.
- Voice packs include Ava, Serena, Ethan, Marcus, Vivian, Noah.
- Phrase categories include 产品应用场景, 产品优点与缺点, 竞品差异与替代方案对比, 产品详细参数.
- Review rubric includes 产品价值表达, 异议处理, 材料覆盖度, 句子自然度.

Run:

```bash
npm test -- tests/unit/scenario-packs.test.ts
```

Expected:

```text
FAIL because src/data/scenario-packs.ts does not exist
```

- [ ] **Step 1.2: Implement `ScenarioPack` config**

Create `src/data/scenario-packs.ts` with these exported types:

```ts
export type PracticeGoalId =
  | "customer_qa"
  | "demo_narration"
  | "objection_handling"
  | "solution_meeting"
  | "quick_pitch";

export type VoicePackId =
  | "ava-friendly-buyer"
  | "serena-enterprise-decision-maker"
  | "ethan-technical-lead"
  | "marcus-executive-customer"
  | "vivian-critical-procurement"
  | "noah-channel-partner";

export type VoicePack = {
  id: VoicePackId;
  name: string;
  gender: "female" | "male";
  personality: string;
  voiceStyle: string;
  speed: "medium_slow" | "medium" | "medium_fast" | "fast";
  bestFor: string[];
  modelVoiceHint: string;
};
```

Also export `scenarioPacks` and `defaultScenarioPack`.

- [ ] **Step 1.3: Add scenario helpers**

Create `src/lib/scenarios/current-scenario.ts` with:

```ts
import { defaultScenarioPack, scenarioPacks } from "@/data/scenario-packs";

export function getScenarioPack(scenarioPackId?: string) {
  return scenarioPacks.find((pack) => pack.id === scenarioPackId) || defaultScenarioPack;
}

export function getDefaultVoicePack(scenarioPackId?: string) {
  return getScenarioPack(scenarioPackId).voicePacks[0];
}
```

- [ ] **Step 1.4: Run scenario tests**

Run:

```bash
npm test -- tests/unit/scenario-packs.test.ts
```

Expected:

```text
PASS tests/unit/scenario-packs.test.ts
```

- [ ] **Step 1.5: Run typecheck and commit**

Run:

```bash
npm run typecheck
git add src/data/scenario-packs.ts src/lib/scenarios/current-scenario.ts tests/unit/scenario-packs.test.ts
git commit -m "feat: add scenario pack config"
```

## 4. Milestone 2: Information Architecture And Navigation

**Outcome:** The app has a simpler primary navigation: 今日练习 / 客户材料 / 表达库 / 复盘. Settings and objection bank remain reachable but are not primary modules.

**Files:**

- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/features/progress/progress-view.tsx`
- Modify: `src/app/progress/page.tsx`
- Modify: `tests/unit/static-views.test.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 2.1: Update navigation tests**

Update `tests/unit/static-views.test.tsx` or add a new navigation test so it renders `AppSidebar` and asserts:

- 今日练习 is visible.
- 客户材料 is visible.
- 表达库 is visible.
- 复盘 is visible.
- 进步 is not visible.
- 异议库 is not in the primary navigation.

Run:

```bash
npm test -- tests/unit/static-views.test.tsx
```

Expected:

```text
FAIL because current sidebar still includes 进步 and 异议库
```

- [ ] **Step 2.2: Modify primary nav**

In `src/components/app-sidebar.tsx`:

- Use scenario-pack labels where practical.
- Keep links to `/dashboard`, `/materials`, `/phrasebook`, `/progress`.
- Move `/settings` to a lower auxiliary link.
- Remove `/objection-bank` from primary nav.
- Change `/progress` label to 复盘 and description to 练习总结.

- [ ] **Step 2.3: Rename progress UI**

In `src/features/progress/progress-view.tsx` and `src/app/progress/page.tsx`:

- Use 复盘 in headings and labels.
- Keep route `/progress`.
- Add a link to `/memory` labeled 我的记忆 after that route exists; until Milestone 9, use a disabled-looking card or link hidden behind feature availability.

- [ ] **Step 2.4: Update e2e smoke labels**

In `tests/e2e/smoke.spec.ts`:

- Expect `/dashboard` heading to become 今日练习.
- Expect `/progress` heading to become 复盘.
- Keep `/objection-bank` direct route test only if it remains valuable as a hidden route.

- [ ] **Step 2.5: Verify and commit**

Run:

```bash
npm test -- tests/unit/static-views.test.tsx
npm run typecheck
git add src/components/app-sidebar.tsx src/features/progress/progress-view.tsx src/app/progress/page.tsx tests/unit/static-views.test.tsx tests/e2e/smoke.spec.ts
git commit -m "feat: simplify primary navigation"
```

## 5. Milestone 3: Today Practice Dashboard

**Outcome:** `/dashboard` becomes 今日练习 with one main recommendation, one primary CTA, three secondary actions, recent material, recent review, and weekly focus.

**Files:**

- Create: `src/lib/recommendations/today-recommendation.ts`
- Create: `src/features/dashboard/today-practice-card.tsx`
- Create: `src/features/dashboard/quick-action-strip.tsx`
- Create: `tests/unit/today-recommendation.test.ts`
- Modify: `src/features/dashboard/dashboard-view.tsx`
- Modify: `tests/unit/static-views.test.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 3.1: Add recommendation tests**

Create `tests/unit/today-recommendation.test.ts` that verifies the default recommendation includes:

- Title mentioning 技术负责人 or 隐私与部署异议.
- Reason explaining why this practice is recommended.
- Duration between 8 and 15 minutes.
- One primary href to `/practice`.
- Material label when a recent material exists.

Run:

```bash
npm test -- tests/unit/today-recommendation.test.ts
```

Expected:

```text
FAIL because recommendation helper does not exist
```

- [ ] **Step 3.2: Implement recommendation helper**

Create `src/lib/recommendations/today-recommendation.ts` with a pure function:

```ts
export type TodayRecommendation = {
  title: string;
  reason: string;
  goalLabel: string;
  personaLabel: string;
  voicePackLabel: string;
  materialLabel: string;
  durationMinutes: number;
  href: string;
};

export function getTodayRecommendation(): TodayRecommendation {
  return {
    title: "技术负责人 · 隐私与部署异议",
    reason: "你最近在回答隐私和部署问题时容易解释偏长，今天适合练习更短、更有推进力的回答。",
    goalLabel: "异议处理",
    personaLabel: "技术负责人",
    voicePackLabel: "Ethan 技术负责人",
    materialLabel: "最近客户材料",
    durationMinutes: 8,
    href: "/practice",
  };
}
```

- [ ] **Step 3.3: Build today practice card**

Create `src/features/dashboard/today-practice-card.tsx`.

Required visible content:

- 今日建议你练
- Recommendation title
- Recommendation reason
- AI 客户角色
- 声音包
- 预计时长
- Button: 开始今日练习

- [ ] **Step 3.4: Build quick action strip**

Create `src/features/dashboard/quick-action-strip.tsx` with exactly three actions:

- 上传客户材料 -> `/materials`
- 练一个常见异议 -> `/objection-bank`
- 复习 5 句表达 -> `/phrasebook`

- [ ] **Step 3.5: Replace dashboard layout**

Modify `src/features/dashboard/dashboard-view.tsx` so the first viewport contains:

- Page heading: 今日练习
- One primary CTA card
- Three secondary actions
- Recent material and review summaries below the main recommendation

Remove dashboard content that creates multiple competing primary actions.

- [ ] **Step 3.6: Verify and commit**

Run:

```bash
npm test -- tests/unit/today-recommendation.test.ts tests/unit/static-views.test.tsx
npm run typecheck
git add src/lib/recommendations/today-recommendation.ts src/features/dashboard/today-practice-card.tsx src/features/dashboard/quick-action-strip.tsx src/features/dashboard/dashboard-view.tsx tests/unit/today-recommendation.test.ts tests/unit/static-views.test.tsx tests/e2e/smoke.spec.ts
git commit -m "feat: redesign today practice dashboard"
```

## 6. Milestone 4: Guided Practice Wizard With Voice Packs

**Outcome:** `/practice` uses a 3-step wizard: goal, customer role and voice pack, material and focus. The flow creates a practice session with the selected fields.

**Files:**

- Create: `src/features/practice/practice-wizard.tsx`
- Create: `src/features/practice/voice-pack-selector.tsx`
- Create: `tests/unit/practice-wizard.test.tsx`
- Modify: `src/features/practice/practice-view.tsx`
- Modify: `src/features/practice/practice-setup.tsx`
- Modify: `src/lib/validation/practice.ts`
- Modify: `src/app/api/practice-sessions/route.ts`
- Modify: `tests/api/base-routes.test.ts`
- Modify: `tests/api/realtime-session.test.ts`

- [ ] **Step 4.1: Add wizard behavior tests**

Create `tests/unit/practice-wizard.test.tsx` with tests for:

- Step 1 shows 客户问答, 演示讲解, 异议处理, 方案会议, 60 秒快速表达.
- Step 2 shows customer roles and voice packs.
- Selecting Vivian 挑剔采购 shows its style text.
- Step 3 shows material options and focus tags including 应用场景说明, 优缺点对比, 竞品差异, 产品参数解释.
- Primary button creates a session payload with `goalId`, `personaId`, `voicePackId`, `focusTags`, `materialId`.

Run:

```bash
npm test -- tests/unit/practice-wizard.test.tsx
```

Expected:

```text
FAIL because practice wizard does not exist
```

- [ ] **Step 4.2: Extend practice validation**

Modify `src/lib/validation/practice.ts` to accept:

```ts
goalId: z.string().min(1),
personaId: z.string().min(1),
voicePackId: z.string().min(1),
focusTags: z.array(z.string()).default([]),
materialId: z.string().optional(),
scenarioPackId: z.string().default("rokid-overseas-sales"),
```

- [ ] **Step 4.3: Implement `VoicePackSelector`**

Use `defaultScenarioPack.voicePacks`. Each card must show:

- Name
- Gender label: 女声 or 男声
- Personality
- Voice style
- Speed
- Suitable scenes

Each selectable card must be a button with `aria-pressed`.

- [ ] **Step 4.4: Implement `PracticeWizard`**

Use local React state:

- `step`
- `goalId`
- `personaId`
- `voicePackId`
- `materialId`
- `focusTags`

The default selection should allow the user to click 开始练习 without changing advanced settings.

- [ ] **Step 4.5: Wire wizard into `/practice`**

Modify `src/features/practice/practice-view.tsx` to render the wizard as the primary visible flow.

Keep `practice-setup.tsx` either as a compatibility wrapper or internal component if existing tests still import it.

- [ ] **Step 4.6: Accept new payload in session API**

Modify `src/app/api/practice-sessions/route.ts` to store the selected scenario, persona, voice pack, focus tags, and material.

The API response should include the selected `voicePackId` so the realtime route can use it.

- [ ] **Step 4.7: Verify and commit**

Run:

```bash
npm test -- tests/unit/practice-wizard.test.tsx tests/api/base-routes.test.ts tests/api/realtime-session.test.ts
npm run typecheck
git add src/features/practice/practice-wizard.tsx src/features/practice/voice-pack-selector.tsx src/features/practice/practice-view.tsx src/features/practice/practice-setup.tsx src/lib/validation/practice.ts src/app/api/practice-sessions/route.ts tests/unit/practice-wizard.test.tsx tests/api/base-routes.test.ts tests/api/realtime-session.test.ts
git commit -m "feat: add guided practice wizard"
```

## 7. Milestone 5: Realtime Room Redesign

**Outcome:** `/practice/[sessionId]` feels like a live call. The main state is 对话中, controls are simple, and transcript supports default and expanded modes.

**Files:**

- Create: `src/features/practice/conversation-transcript-panel.tsx`
- Create: `tests/unit/transcript-panel.test.tsx`
- Modify: `src/features/practice/realtime-room.tsx`
- Modify: `src/features/practice/live-meeting-panel.tsx`
- Modify: `src/features/practice/smart-support-panel.tsx`
- Modify: `src/lib/ai/realtime.ts`
- Modify: `tests/unit/realtime-room.test.tsx`
- Modify: `tests/unit/realtime-room-webrtc.test.tsx`
- Modify: `tests/unit/realtime-instructions.test.ts`

- [ ] **Step 5.1: Add transcript panel tests**

Create `tests/unit/transcript-panel.test.tsx` with tests for:

- Default mode shows only recent English transcript.
- Default mode does not show Chinese translations.
- Clicking the default module expands full transcript.
- Full transcript shows AI English plus Chinese translation.
- Full transcript shows user English.
- Clicking 折叠 returns to default mode.

Run:

```bash
npm test -- tests/unit/transcript-panel.test.tsx
```

Expected:

```text
FAIL because conversation transcript panel does not exist
```

- [ ] **Step 5.2: Implement transcript data shape**

Support transcript turns shaped like:

```ts
export type TranscriptTurn = {
  id: string;
  speaker: "ai_customer" | "user" | "system";
  text: string;
  translationZh?: string;
  timestamp: number;
};
```

Translations can be mock/fallback text in this milestone if DeepSeek translation is not connected yet.

- [ ] **Step 5.3: Implement `ConversationTranscriptPanel`**

Default mode:

- Shows title: 实时字幕
- Shows latest 2-3 turns
- Shows English only
- Whole module is clickable

Expanded mode:

- Shows title: 完整字幕
- Shows a top-right button: 折叠
- Keeps expanded until 折叠 is clicked
- Shows AI English and Chinese translation
- Shows user English
- Allows vertical scrolling for history

- [ ] **Step 5.4: Simplify live call controls**

Modify `src/features/practice/live-meeting-panel.tsx`:

- Main visible state during active session: 对话中
- Primary controls: 静音, 结束并复盘
- Keep start control before session begins.
- Make end control always visible once session starts.

- [ ] **Step 5.5: Update `RealtimeRoom`**

Modify `src/features/practice/realtime-room.tsx`:

- Use `ConversationTranscriptPanel`.
- Pass voice pack label when available.
- Keep technical states out of primary visual hierarchy.
- Convert error text to user-facing Chinese.
- Ensure mock mode still works for local tests.

- [ ] **Step 5.6: Update realtime instructions**

Modify `src/lib/ai/realtime.ts` so generated instructions include:

- Scenario pack
- Practice goal
- AI customer role
- Voice pack intent and mapped voice id
- Current material summary
- Relevant memory snippets
- Focus tags

- [ ] **Step 5.7: Verify and commit**

Run:

```bash
npm test -- tests/unit/transcript-panel.test.tsx tests/unit/realtime-room.test.tsx tests/unit/realtime-room-webrtc.test.tsx tests/unit/realtime-instructions.test.ts
npm run typecheck
git add src/features/practice/conversation-transcript-panel.tsx src/features/practice/realtime-room.tsx src/features/practice/live-meeting-panel.tsx src/features/practice/smart-support-panel.tsx src/lib/ai/realtime.ts tests/unit/transcript-panel.test.tsx tests/unit/realtime-room.test.tsx tests/unit/realtime-room-webrtc.test.tsx tests/unit/realtime-instructions.test.ts
git commit -m "feat: redesign realtime practice room"
```

## 8. Milestone 6: Customer Materials As Prep Station

**Outcome:** `/materials` becomes a customer preparation center. Uploading or selecting material leads to summary, likely questions, product topics, memory status, prep card, and practice action.

**Files:**

- Modify: `src/features/materials/materials-view.tsx`
- Modify: `src/features/materials/material-upload.tsx`
- Modify: `src/features/materials/material-list.tsx`
- Modify: `src/features/materials/material-brief-view.tsx`
- Modify: `src/lib/ai/material-brief.ts`
- Modify: `src/lib/materials/material-store.ts`
- Modify: `src/lib/validation/materials.ts`
- Modify: `tests/unit/materials-view.test.tsx`
- Modify: `tests/unit/materials-ui.test.tsx`
- Modify: `tests/unit/material-brief.test.ts`
- Modify: `tests/api/material-brief-route.test.ts`

- [ ] **Step 6.1: Update material brief tests**

Extend material brief tests to require:

- Core summary
- Likely customer questions
- Product application scenarios
- Product pros and cons
- Competitor differences
- Product parameters
- Memory status

Run:

```bash
npm test -- tests/unit/material-brief.test.ts tests/api/material-brief-route.test.ts
```

Expected:

```text
FAIL because current material brief does not include all new sections
```

- [ ] **Step 6.2: Extend material validation**

Modify `src/lib/validation/materials.ts` so material brief responses include:

```ts
applicationScenarios: z.array(z.string()).default([]),
pros: z.array(z.string()).default([]),
cons: z.array(z.string()).default([]),
competitorDifferences: z.array(z.string()).default([]),
productParameters: z.array(z.string()).default([]),
memoryStatus: z.enum(["session_only", "available_for_future", "saved_to_memory", "confidential"]).default("session_only"),
```

- [ ] **Step 6.3: Update DeepSeek material prompt**

Modify `src/lib/ai/material-brief.ts` so the prompt asks DeepSeek to extract:

- 应用场景
- 优点
- 缺点或适配边界
- 与其他产品的差异点
- 详细参数
- 可能被客户追问的问题

- [ ] **Step 6.4: Redesign materials UI**

Modify material components to show:

- Upload entry
- Recent materials
- Material brief
- Customer likely questions
- Product topics
- Memory status badge
- Buttons: 生成会议准备卡, 用这份材料开始练习

- [ ] **Step 6.5: Add memory status control**

Each material should display one of:

- 仅本次使用
- 可用于后续练习
- 已加入长期记忆
- 保密材料

The control can update local store first and persist to API in the memory milestone.

- [ ] **Step 6.6: Verify and commit**

Run:

```bash
npm test -- tests/unit/materials-view.test.tsx tests/unit/materials-ui.test.tsx tests/unit/material-brief.test.ts tests/api/material-brief-route.test.ts
npm run typecheck
git add src/features/materials/materials-view.tsx src/features/materials/material-upload.tsx src/features/materials/material-list.tsx src/features/materials/material-brief-view.tsx src/lib/ai/material-brief.ts src/lib/materials/material-store.ts src/lib/validation/materials.ts tests/unit/materials-view.test.tsx tests/unit/materials-ui.test.tsx tests/unit/material-brief.test.ts tests/api/material-brief-route.test.ts
git commit -m "feat: turn materials into prep station"
```

## 9. Milestone 7: Review Flow, Sentence Status, And Memory Candidates

**Outcome:** Review pages lead with a 30-second conclusion, support sentence upgrade or positive confirmation, and allow memory candidate confirmation.

**Files:**

- Create: `src/features/reviews/review-summary-card.tsx`
- Create: `src/features/reviews/memory-candidates.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Modify: `src/features/reviews/sentence-upgrade-table.tsx`
- Modify: `src/lib/validation/reviews.ts`
- Modify: `src/lib/ai/review.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/review/route.ts`
- Modify: `tests/unit/review-view.test.tsx`
- Modify: `tests/unit/review-generation.test.ts`
- Modify: `tests/api/practice-review.test.ts`

- [ ] **Step 7.1: Extend review schema tests**

Update tests so `sentenceUpgrades` can contain:

```ts
{
  status: "needs_upgrade",
  original: "We have translation function.",
  naturalEnglish: "Rokid supports real-time translated captions...",
  chineseExplanation: "这句话需要从功能改成价值表达。",
  practicePrompt: "Explain it again with a business outcome."
}
```

and:

```ts
{
  status: "already_natural",
  original: "A practical next step would be to run a small pilot with one team.",
  positiveFeedback: "这句话已经自然、清楚，适合当前商务场景。",
  chineseExplanation: "这句话清楚表达了下一步。",
  practicePrompt: "Use this structure in another scenario."
}
```

Run:

```bash
npm test -- tests/unit/review-view.test.tsx tests/unit/review-generation.test.ts
```

Expected:

```text
FAIL because current schema assumes every sentence has naturalEnglish
```

- [ ] **Step 7.2: Update review validation**

Modify `src/lib/validation/reviews.ts`:

- Add `status: "needs_upgrade" | "already_natural"`.
- Require `naturalEnglish` only when `status` is `needs_upgrade`.
- Require `positiveFeedback` only when `status` is `already_natural`.
- Add `memoryCandidates` with type, title, summary, sensitivity, confidence.

- [ ] **Step 7.3: Update DeepSeek review prompt**

Modify `src/lib/ai/review.ts` to ask DeepSeek:

- Do not rewrite naturally spoken sentences.
- Mark natural sentences as `already_natural`.
- Generate memory candidates after each review.
- Include next practice recommendation.

- [ ] **Step 7.4: Build 30-second summary**

Create `src/features/reviews/review-summary-card.tsx`.

It must show:

- 这次最好的地方
- 这次最需要改的地方
- 下一次建议练什么

- [ ] **Step 7.5: Build memory candidates component**

Create `src/features/reviews/memory-candidates.tsx`.

It must show:

- Candidate title
- Candidate summary
- Type
- Sensitivity badge
- Buttons: 保存全部, 逐条编辑, 不保存

- [ ] **Step 7.6: Update sentence table**

Modify `src/features/reviews/sentence-upgrade-table.tsx`:

- For `needs_upgrade`, show 原句, 中文意思, 更自然英文, 为什么更好.
- For `already_natural`, show 原句, 中文意思, 肯定反馈, 做得好的原因.
- Preserve 保存到表达库.

- [ ] **Step 7.7: Verify and commit**

Run:

```bash
npm test -- tests/unit/review-view.test.tsx tests/unit/review-generation.test.ts tests/api/practice-review.test.ts
npm run typecheck
git add src/features/reviews/review-summary-card.tsx src/features/reviews/memory-candidates.tsx src/features/reviews/review-view.tsx src/features/reviews/sentence-upgrade-table.tsx src/lib/validation/reviews.ts src/lib/ai/review.ts src/app/api/practice-sessions/[sessionId]/review/route.ts tests/unit/review-view.test.tsx tests/unit/review-generation.test.ts tests/api/practice-review.test.ts
git commit -m "feat: redesign practice review flow"
```

## 10. Milestone 8: Phrasebook As Daily Practice Tool

**Outcome:** `/phrasebook` becomes a review and practice tool with today’s 5 phrases, expanded Rokid product categories, mastery states, and “练这句”.

**Files:**

- Create: `src/features/phrasebook/daily-phrase-practice.tsx`
- Modify: `src/features/phrasebook/phrasebook-view.tsx`
- Modify: `src/data/seed-phrases.ts`
- Modify: `src/lib/validation/phrasebook.ts`
- Modify: `src/app/api/phrasebook/route.ts`
- Modify: `tests/unit/static-views.test.tsx`
- Modify: `tests/api/phrasebook-duplicates.test.ts`

- [ ] **Step 8.1: Update phrasebook tests**

Update tests to require:

- Heading: 表达库
- Section: 今天建议复习
- Exactly 5 daily phrase cards in default mock data
- Categories include 产品应用场景, 产品优点与缺点, 竞品差异与替代方案对比, 产品详细参数
- Each phrase card has 练这句

Run:

```bash
npm test -- tests/unit/static-views.test.tsx tests/api/phrasebook-duplicates.test.ts
```

Expected:

```text
FAIL because current phrasebook is still library-oriented
```

- [ ] **Step 8.2: Extend phrase validation**

Modify `src/lib/validation/phrasebook.ts`:

- Add `masteryStatus: "new" | "needs_practice" | "reviewing" | "mastered"`.
- Add category enum values from the PRD.
- Keep existing API compatibility by defaulting missing mastery to `needs_practice`.

- [ ] **Step 8.3: Add daily phrase practice component**

Create `src/features/phrasebook/daily-phrase-practice.tsx`.

It must render:

- Today’s 5 phrases
- English phrase
- Chinese meaning
- Use case
- Mastery status
- Button: 练这句

- [ ] **Step 8.4: Redesign phrasebook page**

Modify `src/features/phrasebook/phrasebook-view.tsx`:

- First section is 今天建议复习.
- Secondary sections are 最近复盘保存, Rokid 高频产品表达, 异议回答表达, 我的个人表达, 材料专属表达.
- Filters remain available but not visually dominant.

- [ ] **Step 8.5: Verify and commit**

Run:

```bash
npm test -- tests/unit/static-views.test.tsx tests/api/phrasebook-duplicates.test.ts
npm run typecheck
git add src/features/phrasebook/daily-phrase-practice.tsx src/features/phrasebook/phrasebook-view.tsx src/data/seed-phrases.ts src/lib/validation/phrasebook.ts src/app/api/phrasebook/route.ts tests/unit/static-views.test.tsx tests/api/phrasebook-duplicates.test.ts
git commit -m "feat: make phrasebook practice oriented"
```

## 11. Milestone 9: Memory Center And Memory APIs

**Outcome:** Users can view, create, disable, edit, and delete memory items. Review and materials can send candidate memories into this system.

**Files:**

- Create: `src/lib/validation/memory.ts`
- Create: `src/lib/memory/memory-store.ts`
- Create: `src/features/memory/memory-center-view.tsx`
- Create: `src/app/memory/page.tsx`
- Create: `src/app/api/memories/route.ts`
- Create: `src/app/api/memories/[memoryId]/route.ts`
- Create: `tests/unit/memory-center.test.tsx`
- Create: `tests/api/memories.test.ts`
- Modify: `src/features/progress/progress-view.tsx`
- Modify: `src/features/reviews/memory-candidates.tsx`

- [ ] **Step 9.1: Add memory validation tests**

Create `tests/api/memories.test.ts` to verify:

- `GET /api/memories` returns memory items.
- `POST /api/memories` creates a memory item.
- `PATCH /api/memories/[memoryId]` updates `enabledForAi`.
- `DELETE /api/memories/[memoryId]` removes an item.

Run:

```bash
npm test -- tests/api/memories.test.ts
```

Expected:

```text
FAIL because memory routes do not exist
```

- [ ] **Step 9.2: Implement memory schemas**

Create `src/lib/validation/memory.ts` with:

```ts
export const memoryTypes = [
  "profile",
  "speaking_habit",
  "weakness",
  "material_context",
  "customer_context",
  "phrase_preference",
  "learning_preference",
] as const;
```

Memory item fields:

- `id`
- `scenarioPackId`
- `type`
- `title`
- `summary`
- `source`
- `sourceCreatedAt`
- `confidence`
- `importance`
- `lastUsedAt`
- `useCount`
- `enabledForAi`
- `sensitive`
- `expiresAt`
- `createdAt`
- `updatedAt`

- [ ] **Step 9.3: Implement mock memory store**

Create `src/lib/memory/memory-store.ts` with in-memory operations:

- `listMemories`
- `createMemory`
- `updateMemory`
- `deleteMemory`
- `rankMemoriesForPractice`

Ranking should use:

```text
相关性 45%
最近性 15%
使用频率 15%
重要性 15%
置信度 10%
```

The first implementation can approximate relevance by matching focus tag text in title or summary.

- [ ] **Step 9.4: Implement memory API routes**

Create:

- `src/app/api/memories/route.ts`
- `src/app/api/memories/[memoryId]/route.ts`

Return Chinese-friendly error messages for invalid input.

- [ ] **Step 9.5: Build memory center view**

Create `src/features/memory/memory-center-view.tsx`.

It must show:

- 我的记忆
- Category filters
- Memory title and summary
- Source
- Sensitivity badge
- Toggle: 用于 AI 练习
- Edit button
- Delete button

- [ ] **Step 9.6: Add memory route**

Create `src/app/memory/page.tsx` that renders `MemoryCenterView`.

Add a link from `src/features/progress/progress-view.tsx` labeled 我的记忆.

- [ ] **Step 9.7: Wire review memory candidates**

Modify `src/features/reviews/memory-candidates.tsx`:

- 保存全部 posts to `/api/memories`.
- 不保存 marks local UI as dismissed.
- 逐条编辑 exposes editable title/summary inputs.

- [ ] **Step 9.8: Verify and commit**

Run:

```bash
npm test -- tests/api/memories.test.ts tests/unit/memory-center.test.tsx tests/unit/review-view.test.tsx
npm run typecheck
git add src/lib/validation/memory.ts src/lib/memory/memory-store.ts src/features/memory/memory-center-view.tsx src/app/memory/page.tsx src/app/api/memories/route.ts src/app/api/memories/[memoryId]/route.ts src/features/progress/progress-view.tsx src/features/reviews/memory-candidates.tsx tests/api/memories.test.ts tests/unit/memory-center.test.tsx tests/unit/review-view.test.tsx
git commit -m "feat: add memory center"
```

## 12. Milestone 10: DeepSeek Text Tasks And Gemini Live Boundaries

**Outcome:** The code clearly separates realtime voice tasks from text analysis tasks. Gemini handles realtime voice; DeepSeek handles material brief, review, phrase extraction, memory candidates, subtitle translation where needed.

**Files:**

- Modify: `src/lib/ai/text-client.ts`
- Modify: `src/lib/ai/material-brief.ts`
- Modify: `src/lib/ai/prep-card.ts`
- Modify: `src/lib/ai/review.ts`
- Modify: `src/lib/ai/realtime.ts`
- Modify: `src/app/api/materials/[materialId]/brief/route.ts`
- Modify: `src/app/api/prep-cards/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/review/route.ts`
- Modify: `tests/unit/material-brief.test.ts`
- Modify: `tests/unit/prep-card.test.ts`
- Modify: `tests/unit/review-generation.test.ts`
- Modify: `tests/unit/realtime-instructions.test.ts`

- [ ] **Step 10.1: Add AI boundary expectations to tests**

Update tests to assert:

- Realtime instructions include voice pack information.
- Material brief output includes product application, pros/cons, competitor difference, parameters.
- Review output includes memory candidates.
- Review output supports already-natural sentences.

Run:

```bash
npm test -- tests/unit/material-brief.test.ts tests/unit/prep-card.test.ts tests/unit/review-generation.test.ts tests/unit/realtime-instructions.test.ts
```

Expected:

```text
some tests fail until prompts and schemas are updated
```

- [ ] **Step 10.2: Keep Gemini Live in realtime only**

Modify `src/lib/ai/realtime.ts` and realtime routes:

- Accept `voicePackId`.
- Map voice pack to supported realtime voice hint.
- Do not call DeepSeek during the active audio loop.
- Include memory snippets before session start only.

- [ ] **Step 10.3: Use DeepSeek for text tasks**

Modify text-generation modules:

- `material-brief.ts` for material analysis.
- `prep-card.ts` for meeting preparation.
- `review.ts` for post-practice review.
- Future subtitle translation can use `text-client.ts` outside the realtime audio loop.

- [ ] **Step 10.4: Verify prompt outputs against schemas**

Run:

```bash
npm test -- tests/unit/material-brief.test.ts tests/unit/prep-card.test.ts tests/unit/review-generation.test.ts tests/unit/realtime-instructions.test.ts
npm run typecheck
git add src/lib/ai/text-client.ts src/lib/ai/material-brief.ts src/lib/ai/prep-card.ts src/lib/ai/review.ts src/lib/ai/realtime.ts src/app/api/materials/[materialId]/brief/route.ts src/app/api/prep-cards/route.ts src/app/api/practice-sessions/[sessionId]/review/route.ts tests/unit/material-brief.test.ts tests/unit/prep-card.test.ts tests/unit/review-generation.test.ts tests/unit/realtime-instructions.test.ts
git commit -m "feat: connect redesign prompts to text analysis"
```

## 13. Milestone 11: Responsive UI, Accessibility, And Visual Polish

**Outcome:** The redesigned pages feel coherent, touch-friendly, and usable on mobile and desktop.

**Files:**

- Modify: `src/app/globals.css`
- Modify: `src/components/page-header.tsx`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/features/dashboard/dashboard-view.tsx`
- Modify: `src/features/practice/practice-wizard.tsx`
- Modify: `src/features/practice/realtime-room.tsx`
- Modify: `src/features/materials/materials-view.tsx`
- Modify: `src/features/reviews/review-view.tsx`
- Modify: `src/features/phrasebook/phrasebook-view.tsx`
- Modify: `src/features/progress/progress-view.tsx`
- Modify: `src/features/memory/memory-center-view.tsx`
- Create: `tests/e2e/redesign-smoke.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 11.1: Add browser smoke coverage**

Create `tests/e2e/redesign-smoke.spec.ts` to cover:

- `/dashboard` shows 今日练习 and one 开始今日练习 button.
- `/practice` shows the 3-step wizard and voice packs.
- `/practice/session_123` shows 对话中 after mock start and can expand 完整字幕.
- `/materials` shows 用这份材料开始练习.
- `/phrasebook` shows 今天建议复习.
- `/progress` shows 复盘 and 我的记忆.

- [ ] **Step 11.2: Polish global layout**

Modify CSS and component classes so:

- Buttons are at least 44px high.
- Text wraps inside buttons and cards.
- Cards use radius no larger than 8px unless existing token requires it.
- Page sections are not nested cards.
- Primary CTA is visually dominant.
- Mobile has no horizontal scroll.

- [ ] **Step 11.3: Check keyboard and labels**

Verify:

- Icon-only buttons have `aria-label`.
- Transcript expand/collapse is reachable by keyboard.
- Voice pack cards expose selected state with `aria-pressed`.
- Memory toggle has readable label.

- [ ] **Step 11.4: Run visual verification**

Run the dev server:

```bash
npm run dev
```

Open and inspect:

```text
http://127.0.0.1:3000/dashboard
http://127.0.0.1:3000/practice
http://127.0.0.1:3000/practice/session_123
http://127.0.0.1:3000/materials
http://127.0.0.1:3000/phrasebook
http://127.0.0.1:3000/progress
http://127.0.0.1:3000/memory
```

Screens to verify:

- Desktop width 1440px.
- Tablet width 768px.
- Mobile width 390px.

- [ ] **Step 11.5: Verify and commit**

Run:

```bash
npm run e2e
npm run typecheck
git add src/app/globals.css src/components/page-header.tsx src/components/app-sidebar.tsx tests/e2e/redesign-smoke.spec.ts tests/e2e/smoke.spec.ts
git commit -m "test: add responsive smoke coverage"
```

## 14. Milestone 12: Final Verification And Rollout

**Outcome:** The redesign is ready to push and deploy after all checks pass.

**Files:**

- Read: `docs/frontend-redesign-prd.zh-CN.md`
- Read: this implementation plan
- Read: `docs/production-environment-setup.md`

- [ ] **Step 12.1: Run full verification**

Run:

```bash
npm run typecheck
npm test
npm run build
npm run e2e
```

Expected:

```text
all checks pass
```

- [ ] **Step 12.2: Manual product acceptance**

Verify the PRD acceptance checklist:

- 首页首屏有今日推荐练习。
- 用户最多 2 次点击进入练习。
- 实时练习页主状态是 对话中.
- 默认字幕只展示英语。
- 点击字幕模块后完整字幕保持展开。
- 完整字幕右上角有 折叠.
- 复盘首屏给出 30 秒结论。
- 自然句子得到肯定反馈而不是强行改写。
- 表达库有今天建议复习.
- 用户能查看和管理记忆。
- Rokid 场景来自配置。

- [ ] **Step 12.3: Push branch**

Run:

```bash
git status --short
git push origin feature/app-foundation
```

Expected:

```text
branch pushed successfully
```

- [ ] **Step 12.4: Deploy**

If Vercel is connected to the GitHub branch, pushing should trigger deployment.

Check:

```bash
vercel ls
```

Expected:

```text
latest deployment is READY
```

## 15. Product Acceptance Matrix

| PRD Requirement | Implemented By |
| --- | --- |
| 一级导航变为 4 个模块 | Milestone 2 |
| 进步改为复盘 | Milestone 2 |
| 首页突出今日练习 | Milestone 3 |
| 用户 30 秒内开始练习 | Milestone 3, Milestone 4 |
| 三步式练习创建 | Milestone 4 |
| AI 声音包 | Milestone 1, Milestone 4, Milestone 5 |
| 实时对话主状态 对话中 | Milestone 5 |
| 默认字幕英文展示 | Milestone 5 |
| 完整字幕展开并保持 | Milestone 5 |
| 材料变成会前准备中心 | Milestone 6 |
| 产品应用场景分析 | Milestone 6, Milestone 10 |
| 优点缺点分析 | Milestone 6, Milestone 10 |
| 竞品差异分析 | Milestone 6, Milestone 10 |
| 产品参数分析 | Milestone 6, Milestone 10 |
| 复盘 30 秒结论 | Milestone 7 |
| 自然句子肯定反馈 | Milestone 7 |
| 表达库每日复习 | Milestone 8 |
| 长期记忆中心 | Milestone 9 |
| Gemini 只做实时语音 | Milestone 10 |
| DeepSeek 做文本分析 | Milestone 10 |
| 移动端和可访问性 | Milestone 11 |

## 16. Recommended Execution Order

Recommended order:

```text
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12
```

The only intentional ordering change from the PRD is that Scenario Pack foundation is implemented first. This prevents Rokid role, voice pack, phrase category, and navigation text from being copied into multiple pages before the rest of the redesign starts.
