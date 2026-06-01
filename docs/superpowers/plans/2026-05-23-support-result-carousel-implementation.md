# Support Result Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace vertically stacked practice support outputs with one tabbed, horizontally scrollable support result workspace.

**Architecture:** RealtimeRoom will manage a list of support result tabs plus one active tab id. A new `SupportResultWorkspace` component will render the tab strip, close buttons, retry controls, and active content slot while existing result panels continue to render the actual AI analysis content.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind utility classes, Vitest + Testing Library.

---

## File Structure

- Modify `tests/unit/realtime-room.test.tsx`: add/adjust tests for tab creation, active switching, closing behavior, and no duplicate tabs.
- Create `src/features/practice/support-result-workspace.tsx`: focused UI component for the horizontal tab strip and active content container.
- Modify `src/features/practice/realtime-room.tsx`: replace `suggestedAnswer`/`supportCueResult` single-output state with tab state, route cue clicks into the workspace, and render active tab content through existing panel components.

## Task 1: Add Failing Tests For Tabbed Support Results

**Files:**
- Modify: `tests/unit/realtime-room.test.tsx`

- [ ] **Step 1: Add a test for opening multiple support modules**

Add a test that:

```ts
it("shows support results in switchable tabs instead of stacking panels", async () => {
  // Render with an AI customer turn.
  // Click 打开提示面板.
  // Click 建议回答 and wait for its result.
  // Click 换个更自然表达 and wait for its result.
  // Expect a region named 辅助结果工作区.
  // Expect tab buttons 建议回答 and 更自然表达.
  // Expect 更自然表达 content visible.
  // Click 建议回答 tab.
  // Expect 建议回答 content visible and 更自然表达 content hidden.
});
```

- [ ] **Step 2: Add a test for close behavior**

Add a test that:

```ts
it("closes individual support result tabs and hides the workspace after the last close", async () => {
  // Open 建议回答 and 更自然表达.
  // Close the active 更自然表达 tab.
  // Expect 建议回答 to become active.
  // Close 建议回答.
  // Expect 辅助结果工作区 to be hidden.
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx
```

Expected: the new tests fail because the workspace component and tab state do not exist.

## Task 2: Build The Support Result Workspace Component

**Files:**
- Create: `src/features/practice/support-result-workspace.tsx`

- [ ] **Step 1: Implement tab view types**

Create:

```ts
export type SupportResultTabType =
  | "suggested-answer"
  | "better-phrase"
  | "discovery-question"
  | "material-point"
  | "challenge-me";

export type SupportResultTabStatus = "loading" | "ready" | "error";

export type SupportResultTabView = {
  id: string;
  title: string;
  type: SupportResultTabType;
  status: SupportResultTabStatus;
  errorMessage?: string;
};
```

- [ ] **Step 2: Implement `SupportResultWorkspace`**

The component accepts:

```ts
type SupportResultWorkspaceProps = {
  activeTabId: string | null;
  children: ReactNode;
  onCloseTab: (tabId: string) => void;
  onRetryTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
  tabs: SupportResultTabView[];
};
```

Behavior:

- Return `null` when `tabs.length === 0`.
- Render a `section` with `aria-label="辅助结果工作区"`.
- Render a horizontal `tablist`.
- Each tab is a button with `role="tab"`.
- Each close button has label `关闭${tab.title}` and stops event propagation.
- Render a retry button only when active tab status is `error`.
- Render `children` as the active panel body.

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx
```

Expected: tests still fail until RealtimeRoom uses the component.

## Task 3: Replace Single Result State With Tab State

**Files:**
- Modify: `src/features/practice/realtime-room.tsx`

- [ ] **Step 1: Add tab state and mapping helpers**

Add:

```ts
type SupportResultTab = SupportResultTabView & {
  payload?: SuggestedAnswerRecord | SupportCueResult;
};

const cueToSupportResultTabType = {
  "Better Phrase": "better-phrase",
  "Use Material Point": "material-point",
  "Ask a Discovery Question": "discovery-question",
  "Challenge Me": "challenge-me",
} satisfies Record<SupportCue, SupportResultTabType>;
```

Add helpers:

```ts
function supportResultTabTitle(type: SupportResultTabType) { ... }
function upsertSupportResultTab(tab: SupportResultTab) { ... }
function activateExistingSupportResultTab(type: SupportResultTabType) { ... }
function closeSupportResultTab(tabId: string) { ... }
```

- [ ] **Step 2: Update `handleSuggestedAnswer`**

Behavior:

- If a suggested-answer tab exists and this is not an explicit retry, only activate it.
- If no latest AI turn exists, upsert an error tab.
- Otherwise upsert a loading tab, fetch `/suggested-answer`, then upsert a ready or error tab.

- [ ] **Step 3: Update `handleCue`**

Behavior:

- Map support cue to a tab type.
- If a tab of that type exists and this is not an explicit retry, only activate it.
- Otherwise upsert a loading tab, fetch `/support-cue`, then upsert a ready or error tab.
- Keep the existing rule that support cues never send a live customer cue into realtime audio.

- [ ] **Step 4: Render workspace under transcript**

Replace:

```tsx
<SuggestedAnswerPanel ... />
<SupportCueResultPanel ... />
```

with:

```tsx
<SupportResultWorkspace ...>
  {renderActiveSupportResult()}
</SupportResultWorkspace>
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx
```

Expected: all realtime room tests pass.

## Task 4: Verify Full App

**Files:**
- No source files unless verification reveals defects.

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Browser smoke check**

Start the dev server if needed and open the practice page. Confirm:

- Opening two support modules shows one workspace.
- Tabs switch the visible content.
- Close buttons remove individual modules.
- Closing the last tab hides the workspace.

## Self-Review

- Spec coverage: covers tab creation, switching, closing, loading/error states, non-stacking layout, and regression behavior for AI endpoints.
- Placeholder scan: no placeholder implementation steps remain.
- Type consistency: plan uses `SupportResultTabType`, `SupportResultTabStatus`, and `SupportResultTabView` consistently across tasks.
