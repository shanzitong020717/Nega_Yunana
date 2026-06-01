-- Auth phase 1 follow-up: allow RLS profile creation without service role and reduce advisor warnings.

create policy "Users can insert own profile"
on public."UserProfile"
for insert
to authenticated
with check (
  "authUserId" = (select auth.uid())
  and email = lower((select auth.jwt()) ->> 'email')
);

drop policy if exists "Users can read own prep cards" on public."PrepCard";
drop policy if exists "Users can read own practice sessions" on public."PracticeSession";
drop policy if exists "Users can read own phrases" on public."Phrase";
drop policy if exists "Users can read own weakness metrics" on public."WeaknessMetric";
drop policy if exists "Users can read own material briefs" on public."MaterialBrief";
drop policy if exists "Users can read own transcript turns" on public."TranscriptTurn";
drop policy if exists "Users can read own reviews" on public."Review";

drop policy if exists "Users can read own allowlist status" on public."AllowedUser";
create policy "Users can read own allowlist status"
on public."AllowedUser"
for select
to authenticated
using (email = lower((select auth.jwt()) ->> 'email'));

create index if not exists "PracticeSession_prepCardId_idx"
on public."PracticeSession"("prepCardId");

revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
revoke execute on function public.rls_auto_enable() from public;
