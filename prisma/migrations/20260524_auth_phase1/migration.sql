-- Auth phase 1: Supabase Auth profile binding, allowlist, and RLS.

CREATE TYPE "AllowedUserStatus" AS ENUM ('INVITED', 'ACTIVE', 'BLOCKED');

CREATE TABLE "AllowedUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "AllowedUserStatus" NOT NULL DEFAULT 'INVITED',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowedUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AllowedUser_email_key" ON "AllowedUser"("email");
CREATE INDEX "AllowedUser_status_idx" ON "AllowedUser"("status");

ALTER TABLE "UserProfile"
    ADD COLUMN "authUserId" UUID,
    ADD COLUMN "email" TEXT,
    ADD COLUMN "avatarUrl" TEXT;

CREATE UNIQUE INDEX "UserProfile_authUserId_key" ON "UserProfile"("authUserId");
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

alter table public."UserProfile" enable row level security;
alter table public."AllowedUser" enable row level security;
alter table public."Material" enable row level security;
alter table public."MaterialBrief" enable row level security;
alter table public."PrepCard" enable row level security;
alter table public."PracticeSession" enable row level security;
alter table public."TranscriptTurn" enable row level security;
alter table public."Review" enable row level security;
alter table public."Phrase" enable row level security;
alter table public."WeaknessMetric" enable row level security;

create policy "Users can read own profile"
on public."UserProfile"
for select
to authenticated
using ("authUserId" = (select auth.uid()));

create policy "Users can update own profile"
on public."UserProfile"
for update
to authenticated
using ("authUserId" = (select auth.uid()))
with check ("authUserId" = (select auth.uid()));

create policy "Users can read own allowlist status"
on public."AllowedUser"
for select
to authenticated
using (email = lower(auth.jwt() ->> 'email'));

create policy "Users can read own materials"
on public."Material"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Material"."ownerId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can insert own materials"
on public."Material"
for insert
to authenticated
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Material"."ownerId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can update own materials"
on public."Material"
for update
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Material"."ownerId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Material"."ownerId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can delete own materials"
on public."Material"
for delete
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Material"."ownerId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own prep cards"
on public."PrepCard"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PrepCard"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own prep cards"
on public."PrepCard"
for all
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PrepCard"."userId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PrepCard"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own practice sessions"
on public."PracticeSession"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PracticeSession"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own practice sessions"
on public."PracticeSession"
for all
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PracticeSession"."userId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "PracticeSession"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own phrases"
on public."Phrase"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Phrase"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own phrases"
on public."Phrase"
for all
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Phrase"."userId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "Phrase"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own weakness metrics"
on public."WeaknessMetric"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "WeaknessMetric"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own weakness metrics"
on public."WeaknessMetric"
for all
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "WeaknessMetric"."userId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "WeaknessMetric"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own material briefs"
on public."MaterialBrief"
for select
to authenticated
using (
  exists (
    select 1
    from public."Material" material
    join public."UserProfile" profile on profile.id = material."ownerId"
    where material.id = "MaterialBrief"."materialId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own material briefs"
on public."MaterialBrief"
for all
to authenticated
using (
  exists (
    select 1
    from public."Material" material
    join public."UserProfile" profile on profile.id = material."ownerId"
    where material.id = "MaterialBrief"."materialId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."Material" material
    join public."UserProfile" profile on profile.id = material."ownerId"
    where material.id = "MaterialBrief"."materialId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own transcript turns"
on public."TranscriptTurn"
for select
to authenticated
using (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "TranscriptTurn"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own transcript turns"
on public."TranscriptTurn"
for all
to authenticated
using (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "TranscriptTurn"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "TranscriptTurn"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can read own reviews"
on public."Review"
for select
to authenticated
using (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "Review"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own reviews"
on public."Review"
for all
to authenticated
using (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "Review"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."PracticeSession" session
    join public."UserProfile" profile on profile.id = session."userId"
    where session.id = "Review"."sessionId"
      and profile."authUserId" = (select auth.uid())
  )
);
