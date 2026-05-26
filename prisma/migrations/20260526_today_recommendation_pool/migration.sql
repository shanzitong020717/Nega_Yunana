create table if not exists public."TodayRecommendationPool" (
  "id" text not null,
  "userId" text not null,
  "dateKey" text not null,
  "activeIndex" integer not null default 0,
  "items" jsonb not null default '[]',
  "generatedAt" timestamp(3) without time zone not null default current_timestamp,
  "createdAt" timestamp(3) without time zone not null default current_timestamp,
  "updatedAt" timestamp(3) without time zone not null,
  constraint "TodayRecommendationPool_pkey" primary key ("id")
);

create unique index if not exists "TodayRecommendationPool_userId_dateKey_key"
on public."TodayRecommendationPool"("userId", "dateKey");

create index if not exists "TodayRecommendationPool_userId_idx"
on public."TodayRecommendationPool"("userId");

create index if not exists "TodayRecommendationPool_dateKey_idx"
on public."TodayRecommendationPool"("dateKey");

alter table public."TodayRecommendationPool"
  add constraint "TodayRecommendationPool_userId_fkey"
  foreign key ("userId") references public."UserProfile"("id")
  on delete cascade on update cascade;

alter table public."TodayRecommendationPool" enable row level security;

create policy "Users can read own today recommendation pools"
on public."TodayRecommendationPool"
for select
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "TodayRecommendationPool"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);

create policy "Users can write own today recommendation pools"
on public."TodayRecommendationPool"
for all
to authenticated
using (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "TodayRecommendationPool"."userId"
      and profile."authUserId" = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."UserProfile" profile
    where profile.id = "TodayRecommendationPool"."userId"
      and profile."authUserId" = (select auth.uid())
  )
);
