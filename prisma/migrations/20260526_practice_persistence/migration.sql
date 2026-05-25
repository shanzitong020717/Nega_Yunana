alter table public."PracticeSession"
  add column if not exists "scenarioPackId" text not null default 'rokid-overseas-sales',
  add column if not exists "goalId" text not null default 'customer_qa',
  add column if not exists "voicePackId" text not null default 'kore-firm',
  add column if not exists "materialMode" text,
  add column if not exists "focusTags" jsonb not null default '[]',
  add column if not exists "resolvedContext" jsonb,
  add column if not exists "payload" jsonb not null default '{}';

alter table public."Review"
  add column if not exists "payload" jsonb not null default '{}';

create index if not exists "PracticeSession_goalId_idx"
on public."PracticeSession"("goalId");
