# Smart Guidance Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the live prompt panel into a lightweight realtime coaching surface with an always-visible smart guidance card and focused manual tools.

**Architecture:** Keep the implementation client-side for this milestone. `RealtimeRoom` derives a `SmartGuidanceState` from the latest transcript turns and passes it to `SmartSupportPanel`, which renders the smart guidance card plus grouped tool controls.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Redesign SmartSupportPanel

**Files:**
- Modify: `src/features/practice/smart-support-panel.tsx`
- Test: `tests/unit/realtime-room.test.tsx`

- [ ] Write failing tests that expect the prompt panel to show `智能建议`, grouped controls, and no `缩短回答` / `翻译这句话` buttons.
- [ ] Add a `SmartGuidanceState` prop with `currentJudgment`, `nextStep`, `sayThis`, and optional `riskNote`.
- [ ] Render grouped sections: `核心救场`, `优化表达`, `推进会谈`, `进阶练习`.
- [ ] Keep buttons: `建议回答`, `换个更自然表达`, `问一个探索问题`, `使用材料要点`, `挑战我`.

### Task 2: Generate Lightweight Smart Guidance

**Files:**
- Modify: `src/features/practice/realtime-room.tsx`
- Test: `tests/unit/realtime-room.test.tsx`

- [ ] Add heuristic guidance derived from recent transcript turns.
- [ ] If the latest turn is an AI customer deployment/security question, show a deployment/security guidance card and one direct English sentence.
- [ ] If the latest turn is the user, show a feedback-oriented next step.
- [ ] Pass the guidance state into `SmartSupportPanel`.

### Task 3: Verify

**Files:**
- Test only

- [ ] Run `npm test -- tests/unit/realtime-room.test.tsx`.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
