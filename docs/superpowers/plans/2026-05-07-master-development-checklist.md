# Rokid Overseas Meeting Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Rokid Overseas Meeting Coach website from the PRD in safe, testable milestones: first scaffold the full-stack app, then add API/data foundations, then connect materials, Realtime practice, review, phrasebook, and progress tracking.

**Architecture:** Use a Next.js App Router full-stack app in this repository. Keep UI, route handlers, AI service wrappers, database access, and domain logic separated so each feature can be developed and tested independently. Build a mock-first vertical slice before connecting OpenAI Realtime and file processing, so the product becomes usable early.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-style components, Prisma, PostgreSQL-compatible schema, OpenAI SDK, WebRTC, Zod, Vitest, Playwright.

---

## 0. Scope And Execution Rules

This is a master development checklist, not a single narrow feature plan. The PRD contains several subsystems, so implementation should happen in milestone branches and small pull requests.

Recommended branch naming:

- `feature/app-foundation`
- `feature/api-data-foundation`
- `feature/materials-brief`
- `feature/prep-practice-flow`
- `feature/realtime-room`
- `feature/review-phrasebook`
- `feature/objection-progress`

Recommended commit style:

- `chore: scaffold next app`
- `feat: add app shell navigation`
- `feat: add material upload model`
- `feat: add realtime session endpoint`
- `feat: add review generation service`
- `test: add api validation coverage`

Do not commit:

- `.env`
- `.env.local`
- uploaded customer files
- audio recordings
- transcripts containing real customer data
- OpenAI API keys
- generated local database files if they contain private data

## 1. Planned File Structure

Create this structure as the app grows:

```text
.
├── docs/
│   ├── rokid-overseas-meeting-coach-prd.md
│   └── superpowers/plans/2026-05-07-master-development-checklist.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   ├── materials/route.ts
│   │   │   ├── materials/[materialId]/brief/route.ts
│   │   │   ├── prep-cards/route.ts
│   │   │   ├── practice-sessions/route.ts
│   │   │   ├── practice-sessions/[sessionId]/transcript/route.ts
│   │   │   ├── practice-sessions/[sessionId]/review/route.ts
│   │   │   ├── realtime/session/route.ts
│   │   │   ├── phrasebook/route.ts
│   │   │   └── weaknesses/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── materials/page.tsx
│   │   ├── practice/page.tsx
│   │   ├── practice/[sessionId]/page.tsx
│   │   ├── reviews/[reviewId]/page.tsx
│   │   ├── objection-bank/page.tsx
│   │   ├── phrasebook/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── app-sidebar.tsx
│   │   ├── page-header.tsx
│   │   ├── status-pill.tsx
│   │   └── ui/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── materials/
│   │   ├── practice/
│   │   ├── reviews/
│   │   ├── objection-bank/
│   │   ├── phrasebook/
│   │   └── progress/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── openai-client.ts
│   │   │   ├── material-brief.ts
│   │   │   ├── prep-card.ts
│   │   │   ├── review.ts
│   │   │   └── realtime.ts
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── errors.ts
│   │   ├── file-processing/
│   │   │   ├── extract-text.ts
│   │   │   └── storage.ts
│   │   └── validation/
│   │       ├── materials.ts
│   │       ├── practice.ts
│   │       ├── reviews.ts
│   │       └── phrasebook.ts
│   ├── data/
│   │   ├── personas.ts
│   │   ├── objections.ts
│   │   └── seed-phrases.ts
│   └── test/
│       ├── setup.ts
│       └── fixtures/
├── tests/
│   ├── unit/
│   ├── api/
│   └── e2e/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## 2. Environment Variables

Create `.env.local` locally. Do not commit it.

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
APP_BASE_URL=http://localhost:3000
UPLOAD_DIR=./storage/uploads
CONFIDENTIAL_MODE_DEFAULT=true
```

For the first local build, if PostgreSQL is not ready, use a hosted Postgres provider or a local Docker Postgres instance:

```bash
docker run --name rokid-coach-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=rokid_coach \
  -p 5432:5432 \
  -d postgres:16
```

Then set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rokid_coach?schema=public"
```

## 3. Milestone 1: Project Foundation

**Outcome:** A working Next.js TypeScript app with navigation, layout, styling, linting, tests, and a health API.

**Files:**

- Create: `package.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/api/health/route.ts`
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/page-header.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

### Task 1.1: Initialize The Web App

- [ ] Run:

```bash
npm init -y
npm install next react react-dom zod openai lucide-react clsx tailwind-merge class-variance-authority
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom playwright
```

- [ ] Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] Create `tsconfig.json` with `@/*` mapped to `src/*`.
- [ ] Create `next.config.ts`.
- [ ] Create `postcss.config.js`.
- [ ] Create `tailwind.config.ts`.
- [ ] Run `npm run typecheck`.
- [ ] Commit:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.js tailwind.config.ts
git commit -m "chore: initialize next app tooling"
```

### Task 1.2: Add App Shell

- [ ] Create global layout with sidebar navigation:

```text
Dashboard
Materials
Practice
Objection Bank
Phrasebook
Progress
Settings
```

- [ ] Create empty pages for each route.
- [ ] Ensure `/` redirects or links clearly to `/dashboard`.
- [ ] Add responsive behavior: desktop sidebar, mobile top navigation or drawer.
- [ ] Verify:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`.

- [ ] Run:

```bash
npm run typecheck
npm run build
```

- [ ] Commit:

```bash
git add src/app src/components
git commit -m "feat: add app shell navigation"
```

### Task 1.3: Add Health API

- [ ] Create `GET /api/health`.
- [ ] Response:

```json
{
  "ok": true,
  "service": "rokid-overseas-meeting-coach"
}
```

- [ ] Add an API test that calls the route handler and checks `ok === true`.
- [ ] Run:

```bash
npm run test
```

- [ ] Commit:

```bash
git add src/app/api/health tests src/test vitest.config.ts
git commit -m "test: add health endpoint coverage"
```

## 4. Milestone 2: Domain Data And Database Foundation

**Outcome:** Prisma schema, seed data, domain constants, and typed validation for the core PRD entities.

**Files:**

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/env.ts`
- Create: `src/data/personas.ts`
- Create: `src/data/objections.ts`
- Create: `src/data/seed-phrases.ts`
- Create: `src/lib/validation/*.ts`

### Task 2.1: Add Prisma And Database Client

- [ ] Run:

```bash
npm install @prisma/client
npm install -D prisma tsx
npx prisma init
```

- [ ] Define these Prisma models:

```text
UserProfile
Material
MaterialBrief
PrepCard
PracticeSession
TranscriptTurn
Review
Phrase
WeaknessMetric
```

- [ ] Include timestamps on all persisted models.
- [ ] Add `confidentialMode Boolean @default(true)` to `Material`.
- [ ] Add JSON fields for structured AI outputs where flexible schema is useful:

```text
MaterialBrief.productPoints Json
MaterialBrief.likelyQuestions Json
Review.sentenceUpgrades Json
Review.weaknessUpdates Json
```

- [ ] Run:

```bash
npx prisma format
npx prisma migrate dev --name init
npm run typecheck
```

- [ ] Commit:

```bash
git add prisma src/lib/db.ts package.json package-lock.json
git commit -m "feat: add database schema"
```

### Task 2.2: Add Environment Validation

- [ ] Create `src/lib/env.ts` using Zod.
- [ ] Validate:

```text
OPENAI_API_KEY
DATABASE_URL
APP_BASE_URL
UPLOAD_DIR
CONFIDENTIAL_MODE_DEFAULT
```

- [ ] Add a unit test proving missing `OPENAI_API_KEY` returns a clear error in server code.
- [ ] Run:

```bash
npm run test
npm run typecheck
```

- [ ] Commit:

```bash
git add src/lib/env.ts tests/unit
git commit -m "feat: validate server environment"
```

### Task 2.3: Seed Personas, Objections, And Phrasebook Defaults

- [ ] Create `src/data/personas.ts` with:

```text
Distributor
Enterprise Buyer
Technical Lead
Procurement Manager
Skeptical Executive
End User Manager
```

- [ ] Create `src/data/objections.ts` with at least 30 entries across:

```text
Product Value
Accuracy & Reliability
Privacy & Security
Deployment
Competition
Pricing & Pilot
```

- [ ] Create `src/data/seed-phrases.ts` with phrase categories:

```text
Opening
Discovery Questions
Product Positioning
Feature Explanation
Business Value
Demo Narration
Objection Handling
Pricing & Pilot
Closing & Next Step
Follow-up Email
```

- [ ] Add tests checking each required persona/category exists.
- [ ] Commit:

```bash
git add src/data tests/unit
git commit -m "feat: add seed sales training content"
```

## 5. Milestone 3: API Foundation

**Outcome:** Validated route handlers for materials, prep cards, practice sessions, transcripts, reviews, phrasebook, and weaknesses. Early APIs can return mock data where AI integration is not connected yet.

**Files:**

- Create: `src/lib/validation/materials.ts`
- Create: `src/lib/validation/practice.ts`
- Create: `src/lib/validation/reviews.ts`
- Create: `src/lib/validation/phrasebook.ts`
- Create: `src/app/api/materials/route.ts`
- Create: `src/app/api/prep-cards/route.ts`
- Create: `src/app/api/practice-sessions/route.ts`
- Create: `src/app/api/phrasebook/route.ts`
- Create: `src/app/api/weaknesses/route.ts`

### Task 3.1: Define API Validation Schemas

- [ ] Add Zod schemas for:

```text
CreateMaterialInput
CreatePrepCardInput
CreatePracticeSessionInput
TranscriptTurnInput
CreatePhraseInput
WeaknessUpdateInput
```

- [ ] Tests:

```text
valid material input passes
unsupported file type fails
invalid persona id fails
empty phrase English sentence fails
```

- [ ] Run:

```bash
npm run test
```

- [ ] Commit:

```bash
git add src/lib/validation tests/unit
git commit -m "test: add api validation schemas"
```

### Task 3.2: Add Base CRUD Route Handlers

- [ ] Implement:

```text
POST /api/practice-sessions
GET /api/practice-sessions
POST /api/phrasebook
GET /api/phrasebook
GET /api/weaknesses
```

- [ ] Use validation schemas at the API boundary.
- [ ] Return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Customer type is required."
  }
}
```

- [ ] Add route handler tests for success and validation failure.
- [ ] Commit:

```bash
git add src/app/api src/lib/errors.ts tests/api
git commit -m "feat: add base api route handlers"
```

## 6. Milestone 4: Dashboard And Static Product UX

**Outcome:** The user can navigate a polished, useful static product shell with real seed content before AI is connected.

**Files:**

- Create: `src/features/dashboard/dashboard-view.tsx`
- Create: `src/features/objection-bank/objection-bank-view.tsx`
- Create: `src/features/phrasebook/phrasebook-view.tsx`
- Create: `src/features/progress/progress-view.tsx`

### Task 4.1: Build Dashboard

- [ ] Add these dashboard sections:

```text
Today's Recommended Drill
Prepare for a Customer Meeting
Recent Materials
This Week's Focus
Recent Review
```

- [ ] Use seed/mock data from local files until API data is connected.
- [ ] Ensure mobile layout has no horizontal scroll.
- [ ] Run:

```bash
npm run build
```

- [ ] Commit:

```bash
git add src/app/dashboard src/features/dashboard
git commit -m "feat: build dashboard view"
```

### Task 4.2: Build Objection Bank Static View

- [ ] Render categories and built-in objections from `src/data/objections.ts`.
- [ ] Each objection card shows:

```text
Customer Concern
Answer Framework
Short Answer
Professional Answer
Practice button
```

- [ ] Add search/filter by category.
- [ ] Commit:

```bash
git add src/app/objection-bank src/features/objection-bank
git commit -m "feat: build objection bank"
```

### Task 4.3: Build Phrasebook Static View

- [ ] Render built-in phrase categories.
- [ ] Support filters:

```text
category
source
tag
mastery status
```

- [ ] Add empty states for personal saved phrases.
- [ ] Commit:

```bash
git add src/app/phrasebook src/features/phrasebook
git commit -m "feat: build phrasebook view"
```

## 7. Milestone 5: Materials Upload And Material Brief

**Outcome:** User can upload a material, see processing status, and get a structured Material Brief.

**Files:**

- Create: `src/features/materials/material-upload.tsx`
- Create: `src/features/materials/material-list.tsx`
- Create: `src/features/materials/material-brief-view.tsx`
- Create: `src/lib/file-processing/storage.ts`
- Create: `src/lib/file-processing/extract-text.ts`
- Create: `src/lib/ai/material-brief.ts`
- Create: `src/app/api/materials/route.ts`
- Create: `src/app/api/materials/[materialId]/brief/route.ts`

### Task 5.1: Build Upload UI

- [ ] Support selecting:

```text
PDF
PPTX
DOCX
TXT
Markdown
```

- [ ] Add fields:

```text
Material name
Customer type
Customer industry
Meeting goal
Confidential mode
Notes
```

- [ ] Show privacy warning before upload.
- [ ] Add client-side file type and size validation.
- [ ] Commit:

```bash
git add src/app/materials src/features/materials
git commit -m "feat: add material upload ui"
```

### Task 5.2: Implement File Storage

- [ ] Store uploaded files under `UPLOAD_DIR`.
- [ ] Generate non-guessable storage names:

```text
material_<uuid>_<safe-original-name>
```

- [ ] Save metadata in `Material`.
- [ ] Return:

```json
{
  "materialId": "material_...",
  "status": "processing"
}
```

- [ ] Add tests for unsupported file types and confidential mode default.
- [ ] Commit:

```bash
git add src/app/api/materials src/lib/file-processing tests/api
git commit -m "feat: add material upload api"
```

### Task 5.3: Implement Text Extraction MVP

- [ ] Add text extraction for `.txt` and `.md`.
- [ ] For PDF/PPTX/DOCX, store the file and show a clear `processing_not_supported_yet` status until parsers are added.
- [ ] Add parser packages in a separate commit when needed:

```bash
npm install pdf-parse mammoth
```

- [ ] Add tests:

```text
txt extraction returns text
md extraction returns text
unsupported parser returns clear status
```

- [ ] Commit:

```bash
git add src/lib/file-processing tests/unit
git commit -m "feat: add material text extraction"
```

### Task 5.4: Generate Material Brief

- [ ] Create OpenAI service wrapper in `src/lib/ai/openai-client.ts`.
- [ ] Create `generateMaterialBrief()` in `src/lib/ai/material-brief.ts`.
- [ ] Output must include:

```text
keyMessage
productPoints
customerValue
likelyQuestions
likelyObjections
riskyClaims
usefulPhrases
glossary
outline
```

- [ ] Persist output to `MaterialBrief`.
- [ ] Add mock mode for tests so tests do not call OpenAI.
- [ ] Commit:

```bash
git add src/lib/ai src/app/api/materials tests/unit tests/api
git commit -m "feat: generate material briefs"
```

## 8. Milestone 6: Pre-Meeting Prep And Practice Setup

**Outcome:** User can generate a prep card, choose persona/mode/difficulty, and create a practice session.

**Files:**

- Create: `src/features/practice/prep-card-form.tsx`
- Create: `src/features/practice/prep-card-view.tsx`
- Create: `src/features/practice/practice-setup.tsx`
- Create: `src/lib/ai/prep-card.ts`
- Create: `src/app/api/prep-cards/route.ts`
- Create: `src/app/api/practice-sessions/route.ts`

### Task 6.1: Build Prep Card Form And API

- [ ] User inputs:

```text
materialId
customerType
industry
countryOrRegion
meetingGoal
knownConcerns
trainingFocus
```

- [ ] AI output:

```text
Customer Context
Meeting Goal
Key Talking Points
Discovery Questions
Likely Objections
Opening Script
Must-Use Phrases
Do Not Overpromise
```

- [ ] Save to `PrepCard`.
- [ ] Add tests with mocked AI response.
- [ ] Commit:

```bash
git add src/features/practice src/app/api/prep-cards src/lib/ai/prep-card.ts tests
git commit -m "feat: add meeting prep cards"
```

### Task 6.2: Build Practice Setup

- [ ] User selects:

```text
mode: presentation_rehearsal | customer_qa | objection_challenge | solution_meeting
personaId
materialId
prepCardId
difficulty: easy | normal | hard | executive
trainingFocus
```

- [ ] `POST /api/practice-sessions` creates a session with status `created`.
- [ ] After create, navigate to `/practice/[sessionId]`.
- [ ] Commit:

```bash
git add src/app/practice src/features/practice src/app/api/practice-sessions
git commit -m "feat: add practice setup flow"
```

## 9. Milestone 7: Realtime Practice Room

**Outcome:** User can enter a practice room, start a voice session, see state changes, use cue buttons, end the session, and save transcript.

**Files:**

- Create: `src/features/practice/realtime-room.tsx`
- Create: `src/features/practice/material-navigator.tsx`
- Create: `src/features/practice/live-meeting-panel.tsx`
- Create: `src/features/practice/smart-support-panel.tsx`
- Create: `src/lib/ai/realtime.ts`
- Create: `src/app/api/realtime/session/route.ts`
- Create: `src/app/api/practice-sessions/[sessionId]/transcript/route.ts`

### Task 7.1: Build Mock Realtime Room First

- [ ] UI states:

```text
Ready
In Conversation
Muted
Reconnecting
Mic Permission Required
Connection Error
Session Ended
```

- [ ] Add controls:

```text
Start
Mute
End
Better Phrase
Use Material Point
Ask a Discovery Question
Shorten Answer
Translate This
Challenge Me
```

- [ ] Use mocked transcript turns so the page is usable without OpenAI.
- [ ] Commit:

```bash
git add src/app/practice/[sessionId] src/features/practice
git commit -m "feat: build realtime room mock"
```

### Task 7.2: Add Realtime Session Endpoint

- [ ] `POST /api/realtime/session` receives:

```json
{
  "practiceSessionId": "session_...",
  "personaId": "technical_lead",
  "materialId": "material_...",
  "mode": "customer_qa"
}
```

- [ ] Server builds Realtime instructions from:

```text
practice session
customer persona
material brief
prep card
training focus
```

- [ ] Server returns browser-safe Realtime session credentials.
- [ ] Do not return `OPENAI_API_KEY`.
- [ ] Add tests that assert response does not include the standard API key.
- [ ] Commit:

```bash
git add src/app/api/realtime src/lib/ai/realtime.ts tests/api
git commit -m "feat: add realtime session api"
```

### Task 7.3: Connect Browser WebRTC

- [ ] Request microphone permission only after user clicks Start.
- [ ] Show `Mic Permission Required` if permission fails.
- [ ] Create peer connection from the client using server-issued session credentials.
- [ ] Stream microphone audio to Realtime.
- [ ] Play AI audio response.
- [ ] Capture transcript events where available.
- [ ] On End, call transcript save endpoint.
- [ ] Run manual test in Chrome:

```text
start session
answer one question
click Better Phrase
end session
confirm transcript saved
```

- [ ] Commit:

```bash
git add src/features/practice src/app/api/realtime src/app/api/practice-sessions
git commit -m "feat: connect realtime voice practice"
```

## 10. Milestone 8: Review Generation

**Outcome:** Training session produces a structured review with business scorecard, sentence upgrades, material coverage, phrase suggestions, and weakness updates.

**Files:**

- Create: `src/lib/ai/review.ts`
- Create: `src/features/reviews/review-view.tsx`
- Create: `src/features/reviews/sentence-upgrade-table.tsx`
- Create: `src/features/reviews/replay-practice.tsx`
- Create: `src/app/api/practice-sessions/[sessionId]/review/route.ts`
- Create: `src/app/reviews/[reviewId]/page.tsx`

### Task 8.1: Implement Review Generator

- [ ] Input:

```text
PracticeSession
TranscriptTurn[]
MaterialBrief
PrepCard
Persona
```

- [ ] Output:

```text
meetingOutcome
scores
topImprovements
bestMoments
sentenceUpgrades
materialCoverage
phrasebookSuggestions
weaknessUpdates
nextSessionRecommendation
```

- [ ] Validate AI JSON before saving.
- [ ] If AI JSON is invalid, return a retryable error.
- [ ] Add tests with mock review JSON.
- [ ] Commit:

```bash
git add src/lib/ai/review.ts src/app/api/practice-sessions/[sessionId]/review tests
git commit -m "feat: generate practice reviews"
```

### Task 8.2: Build Review UI

- [ ] Sections:

```text
Meeting Outcome
Business Scorecard
Top 3 Improvements
Best Moments
Sentence Upgrade
Material Coverage
Replay Practice
Phrasebook Suggestions
Next Session Recommendation
```

- [ ] Sentence Upgrade row format:

```text
Original
Natural Business English
中文解释
Practice Prompt
Save to Phrasebook
```

- [ ] Commit:

```bash
git add src/app/reviews src/features/reviews
git commit -m "feat: build review experience"
```

## 11. Milestone 9: Phrasebook And Weakness Tracker

**Outcome:** Review suggestions become long-term learning assets, and the dashboard reflects the user's current focus.

**Files:**

- Modify: `src/app/api/phrasebook/route.ts`
- Modify: `src/app/api/weaknesses/route.ts`
- Modify: `src/features/phrasebook/phrasebook-view.tsx`
- Modify: `src/features/progress/progress-view.tsx`
- Modify: `src/features/dashboard/dashboard-view.tsx`

### Task 9.1: Save Review Phrases

- [ ] Add `Save to Phrasebook` action from review page.
- [ ] Phrase fields:

```text
category
english
chinese
useCase
simpleVersion
professionalVersion
relatedProductPoint
relatedObjection
tags
source
masteryStatus
```

- [ ] Show saved state after click.
- [ ] Add API test for duplicate phrase handling.
- [ ] Commit:

```bash
git add src/app/api/phrasebook src/features/reviews src/features/phrasebook tests/api
git commit -m "feat: save review phrases"
```

### Task 9.2: Update Weakness Tracker From Reviews

- [ ] On review creation, upsert weakness metrics:

```text
Long Answers
Feature-Only Talk
Weak Discovery
Unclear Positioning
Weak Objection Handling
Repetitive Vocabulary
Missing Next Step
Grammar Accuracy
Pronunciation Clarity
Fluency
```

- [ ] Store evidence and recommended drill.
- [ ] Progress page shows:

```text
recent 7-day training count
top weaknesses
improved weaknesses
recommended drills
history list
```

- [ ] Dashboard shows `This Week's Focus`.
- [ ] Commit:

```bash
git add src/app/api/weaknesses src/features/progress src/features/dashboard
git commit -m "feat: track personal weaknesses"
```

## 12. Milestone 10: Objection Bank Practice Integration

**Outcome:** Built-in objections can launch a targeted practice session and be scored after completion.

**Files:**

- Modify: `src/features/objection-bank/objection-bank-view.tsx`
- Modify: `src/app/api/practice-sessions/route.ts`
- Modify: `src/data/objections.ts`

### Task 10.1: Launch Practice From Objection

- [ ] Each objection has a `Practice` button.
- [ ] Button creates practice session:

```text
mode: objection_challenge
personaId: skeptical_executive by default
difficulty: normal by default
trainingFocus: objection_handling
sourceObjectionId
```

- [ ] Navigate to `/practice/[sessionId]`.
- [ ] Commit:

```bash
git add src/features/objection-bank src/app/api/practice-sessions
git commit -m "feat: launch objection practice"
```

### Task 10.2: Review Objection Framework Usage

- [ ] Review generator checks whether user used:

```text
Acknowledge
Clarify
Position
Support
Next Step
```

- [ ] Show missing framework steps in review.
- [ ] Commit:

```bash
git add src/lib/ai/review.ts src/features/reviews
git commit -m "feat: score objection handling framework"
```

## 13. Milestone 11: Sensitive Material Mode

**Outcome:** The product visibly protects sensitive customer materials and gives the user deletion controls.

**Files:**

- Create: `src/features/settings/privacy-settings.tsx`
- Create: `src/app/api/materials/[materialId]/route.ts`
- Create: `src/app/api/practice-sessions/[sessionId]/route.ts`
- Modify: `src/features/materials/material-upload.tsx`
- Modify: `src/features/materials/material-list.tsx`
- Modify: `src/features/reviews/review-view.tsx`

### Task 11.1: Add Confidential Mode UI

- [ ] Upload page shows privacy notice in English and Chinese.
- [ ] Confidential mode defaults to enabled.
- [ ] Material list shows a visible `Confidential` status pill.
- [ ] Commit:

```bash
git add src/features/materials
git commit -m "feat: show confidential material mode"
```

### Task 11.2: Add Delete Controls

- [ ] User can delete:

```text
material
practice session
transcript
review
```

- [ ] Deleting a material removes local stored file and database records connected to it.
- [ ] Add API tests for deletion.
- [ ] Commit:

```bash
git add src/app/api/materials src/app/api/practice-sessions src/features/settings tests/api
git commit -m "feat: add privacy deletion controls"
```

## 14. Milestone 12: Quality, Testing, And Deployment

**Outcome:** The app is stable enough for real use by the target user.

### Task 12.1: Add Playwright Smoke Tests

- [ ] Install browsers:

```bash
npx playwright install
```

- [ ] Add tests:

```text
dashboard loads
materials page opens
practice setup opens
objection bank filters
phrasebook filters
```

- [ ] Run:

```bash
npm run e2e
```

- [ ] Commit:

```bash
git add tests/e2e playwright.config.ts package.json package-lock.json
git commit -m "test: add browser smoke tests"
```

### Task 12.2: Add CI

- [ ] Create `.github/workflows/ci.yml`.
- [ ] CI runs:

```bash
npm ci
npm run typecheck
npm run test
npm run build
```

- [ ] Commit:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add validation workflow"
```

### Task 12.3: Deployment Readiness

- [ ] Confirm production environment variables exist.
- [ ] Confirm uploaded files do not go into git.
- [ ] Confirm `.env.local` is ignored.
- [ ] Confirm `OPENAI_API_KEY` is only used server-side.
- [ ] Confirm Realtime endpoint never returns the standard API key.
- [ ] Confirm confidential mode warning appears before uploads.
- [ ] Run:

```bash
npm run typecheck
npm run test
npm run build
```

- [ ] Commit final deployment docs:

```bash
git add docs
git commit -m "docs: add deployment readiness notes"
```

## 15. Recommended Build Order

Build in this order for the smoothest path:

1. Milestone 1: Project Foundation
2. Milestone 2: Domain Data And Database Foundation
3. Milestone 4: Dashboard And Static Product UX
4. Milestone 3: API Foundation
5. Milestone 5: Materials Upload And Material Brief
6. Milestone 6: Pre-Meeting Prep And Practice Setup
7. Milestone 7: Realtime Practice Room
8. Milestone 8: Review Generation
9. Milestone 9: Phrasebook And Weakness Tracker
10. Milestone 10: Objection Bank Practice Integration
11. Milestone 11: Sensitive Material Mode
12. Milestone 12: Quality, Testing, And Deployment

Reasoning: static UX before AI integration helps verify product flow early; API foundation before Realtime prevents the voice room from becoming a tangled prototype.

## 16. First Vertical Slice

The first version that should feel like a real product is:

```text
Dashboard
-> Practice setup with built-in persona and built-in objection
-> Mock realtime room
-> Save transcript
-> Generate mock review
-> Save one phrase to phrasebook
-> Show one weakness on dashboard
```

This slice proves the product loop before OpenAI Realtime and file upload are fully connected.

Checklist:

- [ ] Dashboard has a recommended drill.
- [ ] Objection Bank has one working Practice button.
- [ ] Practice session is created in database.
- [ ] Practice room shows mock customer question.
- [ ] User can end practice.
- [ ] Transcript is saved.
- [ ] Review page is generated from mock data.
- [ ] One sentence can be saved to Phrasebook.
- [ ] Dashboard shows updated This Week's Focus.

## 17. GitHub Issue Breakdown

Create these GitHub milestones:

```text
M1 App Foundation
M2 Data And API Foundation
M3 Materials And Prep
M4 Realtime Practice
M5 Review And Learning Loop
M6 Privacy And Release Readiness
```

Create these P0 issues:

1. Scaffold Next.js app foundation
2. Add app shell navigation
3. Add Prisma schema and database client
4. Add seed personas, objections, and phrasebook data
5. Add API validation schemas
6. Build Dashboard static view
7. Build Materials upload UI
8. Add material upload API
9. Generate Material Brief
10. Build Meeting Prep Card flow
11. Build Practice Setup flow
12. Build mock Realtime Practice Room
13. Add Realtime session endpoint
14. Connect browser WebRTC practice
15. Save transcript turns
16. Generate structured Review
17. Build Review page
18. Save review phrases to Phrasebook
19. Update Weakness Tracker
20. Integrate Objection Bank practice
21. Add Confidential Mode UI
22. Add delete controls for sensitive data
23. Add CI validation workflow

## 18. PR Acceptance Template

Use this pull request checklist for each feature:

```md
## What changed
- 

## Why
- 

## Screenshots
- 

## Test plan
- [ ] npm run typecheck
- [ ] npm run test
- [ ] npm run build
- [ ] Manual browser check

## Privacy check
- [ ] No API key committed
- [ ] No uploaded material committed
- [ ] No customer transcript committed
- [ ] Server-only OpenAI calls stay server-side
```

## 19. Definition Of Done For MVP

The MVP is done when:

- [ ] User can upload or choose a material.
- [ ] System can generate a Material Brief.
- [ ] User can generate a Meeting Prep Card.
- [ ] User can select a customer persona.
- [ ] User can start and end a Realtime practice session.
- [ ] Transcript is saved.
- [ ] Review is generated with business scorecard and sentence upgrades.
- [ ] User can save phrases from review.
- [ ] Weakness Tracker updates from review.
- [ ] Dashboard recommends next practice.
- [ ] Objection Bank can launch targeted practice.
- [ ] Confidential Mode is visible and enabled by default.
- [ ] User can delete sensitive materials and training records.
- [ ] `npm run typecheck`, `npm run test`, and `npm run build` pass.

## 20. Notes For The First Implementation Session

Start with `feature/app-foundation`.

Commands:

```bash
git checkout -b feature/app-foundation
npm init -y
npm install next react react-dom zod openai lucide-react clsx tailwind-merge class-variance-authority
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom playwright
```

First implementation target:

```text
localhost:3000/dashboard loads a polished dashboard shell
localhost:3000/api/health returns { ok: true }
npm run typecheck passes
npm run build passes
```

First commit target:

```bash
git add .
git commit -m "chore: scaffold app foundation"
```
