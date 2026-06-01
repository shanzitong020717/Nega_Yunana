# Support Cue Action-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the "探索问题" and "材料要点" support cue result panels so their next useful action is visually dominant and easy to use during live practice.

**Architecture:** Keep the existing `/support-cue` API and `SupportCueResult` schema. Add frontend section-selection helpers and specialized action-first renderers inside the existing realtime room module, then refine the text-model prompt so AI results contain the fields those renderers prioritize.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind utility classes, Vitest, Testing Library.

---

### Task 1: Add Action-First UI Tests

**Files:**
- Modify: `tests/unit/realtime-room.test.tsx`

- [ ] **Step 1: Update mock support cue payloads**

Add richer sections to `mockDiscoveryPayload` and `mockMaterialPointPayload`:

```ts
{
  label: "后续判断",
  chinese: "如果客户提到成本、效率或安全，再进入对应价值证明。"
}
```

and:

```ts
{
  label: "使用方式",
  english:
    "Based on the material, this point is most useful when the customer asks about multilingual meeting flow.",
  chinese:
    "基于材料，当客户询问多语言会议流程时，这个要点最适合引用。"
}
```

- [ ] **Step 2: Add discovery action-first assertions**

In the manual cue panel test, after clicking `问一个探索问题`, assert:

```ts
expect(screen.getByText("下一句可以问")).toBeInTheDocument();
expect(screen.getByText("为什么这样问")).toBeInTheDocument();
expect(screen.getByText("客户意图")).toBeInTheDocument();
expect(screen.getByText("问完看什么")).toBeInTheDocument();
expect(screen.queryByText("推荐问题")).not.toBeInTheDocument();
```

- [ ] **Step 3: Add material action-first assertions**

In the same test, after clicking `使用材料要点`, assert:

```ts
expect(screen.getByText("现在最适合引用")).toBeInTheDocument();
expect(screen.getByText("怎么接上话")).toBeInTheDocument();
expect(screen.getByText("材料依据")).toBeInTheDocument();
expect(screen.getByText("不要越界")).toBeInTheDocument();
expect(screen.queryByText("可引用要点")).not.toBeInTheDocument();
```

- [ ] **Step 4: Run the focused test and verify it fails**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx
```

Expected: FAIL because the specialized action-first labels are not rendered yet.

### Task 2: Implement Specialized Renderers

**Files:**
- Modify: `src/features/practice/realtime-room.tsx`

- [ ] **Step 1: Add section label helpers**

Add helpers near the existing support cue label helpers:

```ts
function supportCueLabelIncludes(section: SupportCueResultSection, labels: string[]) {
  const labelKey = normalizeSupportCueLabelKey(section.label);
  return labels.some((label) => labelKey.includes(normalizeSupportCueLabelKey(label)));
}

function findSupportCueSection(
  sections: SupportCueResultSection[],
  labels: string[],
) {
  return sections.find((section) => supportCueLabelIncludes(section, labels));
}
```

- [ ] **Step 2: Add shared action-first atoms**

Add small internal render helpers for:

- `SupportCuePrimaryActionCard`
- `SupportCueInfoBlock`
- `SupportCueSafetyNote`

These helpers should render existing `english`, `chinese`, and `note` fields without inventing content.

- [ ] **Step 3: Add `DiscoveryQuestionResultPanel`**

Create a panel that:

- Uses heading `探索问题建议`.
- Uses primary label `下一句可以问`.
- Selects primary section from labels `推荐问题`, `探索问题`, `建议问题`, `下一句可以问`, `recommended question`.
- Shows supporting labels `为什么这样问`, `客户意图`, `问完看什么` when matching sections exist.
- Shows vocabulary via `SupportCueVocabularyBlock`.

- [ ] **Step 4: Add `MaterialPointResultPanel`**

Create a panel that:

- Uses heading `材料要点建议`.
- Uses primary label `现在最适合引用`.
- Selects primary section from labels `可引用要点`, `材料要点`, `材料证据`, `现在最适合引用`, `material point`.
- Shows supporting labels `怎么接上话`, `材料依据`, `不要越界` when matching sections exist.
- Shows vocabulary via `SupportCueVocabularyBlock`.

- [ ] **Step 5: Route specialized result types**

In `SupportCueResultPanel`, before the generic renderer:

```ts
if (isDiscoveryQuestionResult(result)) {
  return <DiscoveryQuestionResultPanel ... />;
}

if (isMaterialPointResult(result)) {
  return <MaterialPointResultPanel ... />;
}
```

- [ ] **Step 6: Run focused test and verify it passes**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx
```

Expected: PASS.

### Task 3: Tighten AI Prompt Contract

**Files:**
- Modify: `src/lib/ai/support-cue.ts`
- Test: `tests/unit/support-cue-generation.test.ts`

- [ ] **Step 1: Add prompt assertions**

In `tests/unit/support-cue-generation.test.ts`, assert the generated prompt contains:

```ts
expect(prompt).toContain("For Ask a Discovery Question: include a recommended question, why it works, customer intent, and what signal to listen for after asking.");
expect(prompt).toContain("For Use Material Point: include the material-backed point, how to connect it to the conversation, material basis, and a risk boundary.");
```

- [ ] **Step 2: Run support cue generation test and verify it fails**

Run:

```bash
npm test -- tests/unit/support-cue-generation.test.ts
```

Expected: FAIL because the prompt does not yet include the more explicit contract.

- [ ] **Step 3: Update prompt text**

Replace the existing support-cue prompt lines for discovery/material with:

```ts
"For Ask a Discovery Question: include a recommended question, why it works, customer intent, and what signal to listen for after asking.",
"For Use Material Point: include the material-backed point, how to connect it to the conversation, material basis, and a risk boundary.",
```

- [ ] **Step 4: Run support cue generation test and verify it passes**

Run:

```bash
npm test -- tests/unit/support-cue-generation.test.ts
```

Expected: PASS.

### Task 4: Full Verification and Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-05-29-support-cue-action-first-redesign-plan.md`

- [ ] **Step 1: Run focused regression**

Run:

```bash
npm test -- tests/unit/realtime-room.test.tsx tests/unit/support-cue-generation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run project verification**

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-05-29-support-cue-action-first-redesign-plan.md tests/unit/realtime-room.test.tsx tests/unit/support-cue-generation.test.ts src/features/practice/realtime-room.tsx src/lib/ai/support-cue.ts
git commit -m "Redesign discovery and material support panels"
```
