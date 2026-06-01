create type "AiCallStatus" as enum ('SUCCESS', 'ERROR');

create table if not exists public."AiCallDiagnostic" (
  "id" text not null,
  "userId" text,
  "sessionId" text,
  "feature" text not null,
  "schemaName" text not null,
  "provider" text not null,
  "model" text not null,
  "status" "AiCallStatus" not null,
  "durationMs" integer not null,
  "attemptCount" integer not null default 1,
  "maxRetries" integer not null default 0,
  "timeoutMs" integer,
  "httpStatus" integer,
  "errorType" text,
  "errorMessage" text,
  "metadata" jsonb not null default '{}',
  "createdAt" timestamp(3) without time zone not null default current_timestamp,
  constraint "AiCallDiagnostic_pkey" primary key ("id")
);

create index if not exists "AiCallDiagnostic_userId_createdAt_idx"
on public."AiCallDiagnostic"("userId", "createdAt");

create index if not exists "AiCallDiagnostic_status_createdAt_idx"
on public."AiCallDiagnostic"("status", "createdAt");

create index if not exists "AiCallDiagnostic_feature_createdAt_idx"
on public."AiCallDiagnostic"("feature", "createdAt");

create index if not exists "AiCallDiagnostic_sessionId_idx"
on public."AiCallDiagnostic"("sessionId");

alter table public."AiCallDiagnostic"
  add constraint "AiCallDiagnostic_userId_fkey"
  foreign key ("userId") references public."UserProfile"("id")
  on delete set null on update cascade;

alter table public."AiCallDiagnostic" enable row level security;

create policy "Users can read own AI diagnostics"
on public."AiCallDiagnostic"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "AiCallDiagnostic"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);
