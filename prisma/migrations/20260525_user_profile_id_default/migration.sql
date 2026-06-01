alter table public."UserProfile"
alter column "id" set default ('profile_' || replace(gen_random_uuid()::text, '-', ''));
