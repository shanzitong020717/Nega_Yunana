# AI Call Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI call diagnostics system that records text-model reliability, latency, retry, and failure metadata without exposing prompts, API keys, or raw model responses.

**Architecture:** Instrument the shared `generateTextJSON` client so all DeepSeek/OpenAI-compatible text analysis modules emit a non-blocking diagnostic event. Store events in an in-memory ring buffer for tests/local fallback and in Supabase/Postgres when `DATABASE_URL` is available. Expose a protected diagnostics API and a compact Settings page panel for recent calls and summary metrics.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/Postgres on Supabase, Vitest, React.

---

### Task 1: Diagnostics Store And Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260601_ai_call_diagnostics/migration.sql`
- Create: `src/lib/ai/diagnostics.ts`
- Test: `tests/unit/ai-diagnostics.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";

import {
  listAiCallDiagnostics,
  recordAiCallDiagnostic,
  resetAiCallDiagnosticsForTests,
  summarizeAiCallDiagnostics,
} from "@/lib/ai/diagnostics";

describe("AI call diagnostics store", () => {
  it("records sanitized success and error events with summary metrics", () => {
    resetAiCallDiagnosticsForTests();

    recordAiCallDiagnostic({
      feature: "support_cue",
      schemaName: "support cue",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "success",
      durationMs: 840,
      attemptCount: 1,
      maxRetries: 1,
      timeoutMs: 10000,
      userId: "user_1",
      sessionId: "session_1",
    });
    recordAiCallDiagnostic({
      feature: "suggested_answer",
      schemaName: "suggested answer",
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      status: "error",
      durationMs: 12000,
      attemptCount: 2,
      maxRetries: 1,
      timeoutMs: 12000,
      httpStatus: 504,
      errorType: "timeout",
      errorMessage: "request timed out",
      userId: "user_1",
      sessionId: "session_1",
      metadata: {
        prompt: "must not be stored",
        safeKey: "safe value",
      },
    });

    const records = listAiCallDiagnostics({ userId: "user_1" });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      status: "error",
      feature: "suggested_answer",
      httpStatus: 504,
      attemptCount: 2,
    });
    expect(records[0]?.metadata).toEqual({ safeKey: "safe value" });

    expect(summarizeAiCallDiagnostics(records)).toMatchObject({
      total: 2,
      successCount: 1,
      errorCount: 1,
      successRate: 0.5,
      averageDurationMs: 6420,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/ai-diagnostics.test.ts`

Expected: FAIL because `@/lib/ai/diagnostics` does not exist.

- [ ] **Step 3: Implement diagnostics store and schema**

Create a focused diagnostics module with:
- `recordAiCallDiagnostic(event)` for sync in-memory recording plus best-effort async DB persistence.
- `listAiCallDiagnostics(filter)` for user-scoped recent records.
- `summarizeAiCallDiagnostics(records)` for success rate and latency.
- metadata sanitizer that drops `prompt`, `apiKey`, `authorization`, `response`, and `raw`.

Add `AiCallStatus` enum and `AiCallDiagnostic` model to Prisma.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/ai-diagnostics.test.ts`

Expected: PASS.

### Task 2: Instrument Text Model Client

**Files:**
- Modify: `src/lib/ai/text-client.ts`
- Test: `tests/unit/openai-client.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that:
- successful `generateTextJSON` records provider, model, schema, duration, and attempts.
- failed `generateTextJSON` records final error type/status and attempts after retry.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/openai-client.test.ts`

Expected: FAIL because `generateTextJSON` does not emit diagnostics yet.

- [ ] **Step 3: Implement client instrumentation**

Add optional diagnostics context to `GenerateTextJSONInput`, classify failures as `timeout`, `rate_limit`, `upstream_5xx`, `http_error`, `invalid_json`, `empty_response`, or `network_error`, and record exactly one diagnostic event per high-level generation call.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/openai-client.test.ts`

Expected: PASS.

### Task 3: Pass User And Session Context

**Files:**
- Modify: `src/lib/ai/support-cue.ts`
- Modify: `src/lib/ai/suggested-answer.ts`
- Modify: API route handlers under `src/app/api/practice-sessions/[sessionId]/`
- Test: `tests/unit/support-cue-generation.test.ts`
- Test: `tests/unit/suggested-answer-generation.test.ts`

- [ ] **Step 1: Write failing assertions**

Assert that support cues, smart guidance, and suggested answers pass `diagnostics: { userId, sessionId, feature }` into `generateTextJSON`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/support-cue-generation.test.ts tests/unit/suggested-answer-generation.test.ts`

Expected: FAIL because diagnostics context is absent.

- [ ] **Step 3: Implement context plumbing**

Add an optional diagnostics context to generation inputs and pass authenticated `profileId`, `sessionId`, and feature names from route handlers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/support-cue-generation.test.ts tests/unit/suggested-answer-generation.test.ts`

Expected: PASS.

### Task 4: Protected Diagnostics API And Settings UI

**Files:**
- Create: `src/app/api/ai-diagnostics/route.ts`
- Create: `src/features/settings/ai-diagnostics-panel.tsx`
- Modify: `src/app/(app)/settings/page.tsx`
- Test: `tests/api/ai-diagnostics.test.ts`
- Test: `tests/unit/ai-diagnostics-panel.test.tsx`

- [ ] **Step 1: Write failing tests**

API test should seed diagnostics, call `GET /api/ai-diagnostics`, and expect only the logged-in user's records plus summary. UI test should render the panel with success rate, average duration, and recent errors.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/api/ai-diagnostics.test.ts tests/unit/ai-diagnostics-panel.test.tsx`

Expected: FAIL because route and UI do not exist.

- [ ] **Step 3: Implement API and UI**

Build a compact settings section named `AI 调用诊断`, with:
- total calls, success rate, average duration, error count.
- recent call table: module, model, status, duration, attempts, error type/status, time.
- no prompt/body/raw response display.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/api/ai-diagnostics.test.ts tests/unit/ai-diagnostics-panel.test.tsx`

Expected: PASS.

### Task 5: Verification And Deployment

**Files:**
- Generated: `src/generated/prisma/**`

- [ ] **Step 1: Generate Prisma client**

Run: `npm run prisma:generate`

- [ ] **Step 2: Verify quality gates**

Run:
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

- [ ] **Step 3: Apply Supabase migration**

Apply `20260601_ai_call_diagnostics` to Supabase production once tests pass.

- [ ] **Step 4: Deploy Vercel**

Run: `npx vercel --prod --yes`

- [ ] **Step 5: Smoke check**

Run: `curl -sS https://nega-yunana.vercel.app/api/health`

Expected: `{"ok":true,"service":"rokid-overseas-meeting-coach"}`
