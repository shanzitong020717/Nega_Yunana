# Support Cue Action-First Redesign

Date: 2026-05-29

## Summary

Redesign the practice hint submodules "探索问题" and "材料要点" with an action-first layout. The user selected方案 A: each module should make the next useful action obvious first, then explain the reasoning, context, follow-up, and safety boundary.

This redesign focuses on the learner's live conversation moment. The learner should be able to glance at the panel and immediately know what to say next, while still having enough Chinese explanation to learn why that sentence fits the current customer role and conversation context.

## Goals

- Make the core action visually dominant:
  - "探索问题": the next discovery question the learner can ask.
  - "材料要点": the safest material-backed point the learner can cite.
- Keep English above Chinese for speakable content.
- Preserve learning value with concise supporting blocks: why it works, how to follow up, and what to avoid.
- Keep results grounded in the existing AI-generated `/support-cue` output and latest transcript.
- Keep the current tab workspace, manual refresh, close, loading, and error behavior unchanged.

## Non-Goals

- Do not redesign "核心救场", "优化表达", "挑战我", the floating prompt panel, or realtime voice controls in this phase.
- Do not introduce a new backend endpoint.
- Do not change the persisted practice session schema.
- Do not display raw system messages inside these modules.

## Current Problems

The generic `SupportCueResultPanel` renders all non-better-phrase cue results as equal cards in a two-column grid. This makes "探索问题" and "材料要点" feel like loose analysis fragments instead of live assistance.

For "探索问题", the recommended question is not visually dominant enough, and the learner has to scan multiple cards to understand the next move.

For "材料要点", the panel does not clearly separate material evidence, how to say it, and what not to overclaim. This increases the risk that the learner either ignores useful material or says unsupported details.

## Design Direction

Use an action-first panel for both modules:

1. Header: module identity, status badge, and a short purpose.
2. Primary action card: the main sentence or material point to use now.
3. Supporting grid: two to four compact explanation blocks.
4. Safety note: highlighted warning only when available.
5. Vocabulary: same existing vocabulary block at the bottom.

The design should feel like a live cockpit aid, not a report. The learner reads the large card first and can ignore lower sections during a fast conversation.

## Discovery Question Module

### Title

Display title as `探索问题建议`.

### Badge

Use the AI badge from the model result, usually `AI 分析`, with the existing light teal badge style.

### Primary Card

Label: `下一句可以问`

Content:
- English discovery question in stronger font.
- Chinese translation below, with the existing teal left border.

Expected source:
- Prefer section labels that normalize to `推荐问题`, `探索问题`, `建议问题`, `下一句可以问`, or English equivalents such as `recommended question`.
- If no matching section exists, use the first section with English text.

### Supporting Blocks

Render up to three compact blocks:

- `为什么这样问`: explains how the question advances the meeting.
- `客户意图`: summarizes what the customer is trying to clarify or has not said yet.
- `问完看什么`: tells the learner what signal to listen for next.

Expected source:
- Map existing sections by label when possible:
  - `建议原因` -> `为什么这样问`
  - `AI 客户上下文` -> `客户意图`
  - `后续判断`, `下一步`, `follow-up` -> `问完看什么`
- If the AI returns fewer sections, do not show empty placeholder cards.

### Safety Note

If a section has `note`, or a label matching `风险边界`, show it as a compact amber note below the supporting blocks. The note should tell the learner what not to assume or overstate.

## Material Point Module

### Title

Display title as `材料要点建议`.

### Badge

Use the AI badge from the model result, usually `AI 分析`, with the existing light teal badge style.

### Primary Card

Label: `现在最适合引用`

Content:
- Material-backed English point or speakable sentence.
- Chinese translation or explanation below.

Expected source:
- Prefer section labels that normalize to `可引用要点`, `材料要点`, `材料证据`, `现在最适合引用`, or English equivalents such as `material point`.
- If no matching section exists, use the first section with English text.

### Supporting Blocks

Render up to three compact blocks:

- `怎么接上话`: how to connect the material point to the current customer question.
- `材料依据`: what part of the material or prep context supports it.
- `不要越界`: unsupported claims to avoid.

Expected source:
- `使用方式`, `推荐说法`, `how to use` -> `怎么接上话`
- `AI 客户上下文`, `材料证据`, `source` -> `材料依据`
- `风险边界`, `不要越界`, `boundary` -> `不要越界`

### Safety Note

Always prioritize safety for this module. If a risk or boundary section exists, show it in amber. If no risk section exists, do not invent a warning in the UI; the backend prompt will be adjusted during implementation to ask the model for a risk boundary.

## Interaction Behavior

- Opening either cue still creates or selects a tab inside the existing `SupportResultWorkspace`.
- The tab names remain `探索问题` and `材料要点`.
- The existing `刷新当前模块` button remains the way to regenerate the active module using the latest transcript.
- Loading state remains one clean loading card.
- Error state remains a concise status message.
- Closing the tab should remove the module as it does now.

## Data Flow

No new API route is needed.

Frontend:
- `SmartSupportPanel` triggers `handleCue("Ask a Discovery Question")` or `handleCue("Use Material Point")`.
- `RealtimeRoom` sends current `practiceSession` and `conversationTranscriptPayload()` to `/api/practice-sessions/[sessionId]/support-cue`.
- The response is stored in the existing support result tab payload.
- `SupportCueResultPanel` routes results by cue type/title into specialized renderers:
  - Discovery question action-first renderer.
  - Material point action-first renderer.
  - Existing generic renderer for other cue types.

Backend prompt:
- Keep the same schema `{ id, title, badge, sections, vocabulary }`.
- Clarify in the support cue prompt that:
  - `Ask a Discovery Question` should include recommended question, reason, customer intent, and follow-up signal.
  - `Use Material Point` should include material point, how to connect it, material basis, and risk boundary.

## Accessibility

- The primary action card should have an accessible label:
  - `下一句可以问`
  - `现在最适合引用`
- English and Chinese text should wrap naturally and never require horizontal scrolling.
- Buttons and tab controls keep existing focus-visible styles.
- Loading state keeps `aria-live="polite"`.

## Testing Requirements

Add or update unit tests for `RealtimeRoom`:

- "探索问题" renders an action-first panel with:
  - heading `探索问题建议`
  - primary label `下一句可以问`
  - the recommended English question
  - supporting block label `为什么这样问`
  - no generic equal-weight `推荐问题` card as the dominant structure
- "材料要点" renders an action-first panel with:
  - heading `材料要点建议`
  - primary label `现在最适合引用`
  - the material-backed English point
  - supporting block label `怎么接上话`
  - safety label `不要越界` when a risk section exists
- Existing manual refresh tests continue to pass.
- Existing loading-state test continues to ensure no canned content appears while waiting for AI.

## Acceptance Criteria

- The learner can identify the next sentence or material point within the first visible card.
- The design avoids duplicate or same-priority cards for the core recommendation.
- Supporting explanation is concise and scannable.
- The modules remain grounded in AI-generated content and latest transcript.
- All relevant unit tests, lint, typecheck, and build pass.
