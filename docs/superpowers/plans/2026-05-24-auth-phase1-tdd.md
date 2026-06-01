# 账号与数据隔离第一阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 of the account system: Supabase Auth, Google login, email allowlist, protected app/API routes, authenticated user profiles, user-scoped data access, and RLS policies.

**Architecture:** Use Supabase Auth as the only login identity source. Next.js middleware and route helpers enforce authenticated access, `UserProfile.authUserId` links Supabase users to the existing app profile ID, API handlers derive `profileId` on the server, and Supabase RLS enforces ownership through `auth.uid()` plus the profile join.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Auth, `@supabase/ssr`, Prisma/Postgres, SQL RLS policies, Zod, Vitest, Testing Library.

---

## File Map

- Create `src/lib/auth/auth-errors.ts`: typed auth errors and response helpers.
- Create `src/lib/auth/email.ts`: normalize and validate allowlist email values.
- Create `src/lib/auth/supabase-browser.ts`: browser Supabase client using publishable env vars.
- Create `src/lib/auth/supabase-server.ts`: server Supabase client using Next.js cookies.
- Create `src/lib/auth/supabase-admin.ts`: server-only service role client for allowlist/profile sync.
- Create `src/lib/auth/allowlist.ts`: check whitelist status and create/update user profiles.
- Create `src/lib/auth/require-user.ts`: shared API/server guard.
- Create `src/middleware.ts`: refresh session and redirect unauthenticated page requests.
- Create `src/app/login/page.tsx`: public login route.
- Create `src/features/auth/login-view.tsx`: Google and email login UI.
- Create `src/app/auth/callback/route.ts`: OAuth callback and allowlist gate.
- Create `src/app/api/auth/logout/route.ts`: logout API.
- Modify `src/app/layout.tsx`: reduce root layout to HTML/body only.
- Create `src/app/(app)/layout.tsx`: authenticated app shell with sidebar.
- Move authenticated pages into `src/app/(app)/*`: keep `/login` outside the app shell.
- Modify `src/lib/env.ts`: add Supabase env validation.
- Modify `prisma/schema.prisma`: add `AllowedUser`, add `UserProfile.authUserId`, and keep existing business foreign keys pointing at `UserProfile.id`.
- Create `prisma/migrations/20260524_auth_phase1/migration.sql`: SQL migration with profile-linked Supabase ownership and RLS policies.
- Modify protected business API routes: `materials`, `memories`, `phrasebook`, `practice-sessions`, `prep-cards`, `realtime/session`, `review-analytics`, `subtitle-translation`, `today-recommendation`, and `weaknesses`.
- Modify current store modules to accept user scope where they currently return global data.
- Create `tests/unit/auth-email.test.ts`.
- Create `tests/unit/auth-allowlist.test.ts`.
- Create `tests/unit/require-user.test.ts`.
- Create `tests/unit/auth-env.test.ts`.
- Create `tests/unit/auth-login-view.test.tsx`.
- Create `tests/api/auth-callback.test.ts`.
- Create `tests/api/auth-logout.test.ts`.
- Create `tests/api/auth-protected-routes.test.ts`.
- Create `tests/unit/auth-rls-migration.test.ts`.

## Task 1: Add Supabase Environment Contract

**Files:**
- Modify: `src/lib/env.ts`
- Create: `tests/unit/auth-env.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing env test**

Create `tests/unit/auth-env.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

const validEnv = {
  OPENAI_API_KEY: "sk-test-key",
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5432/rokid_coach?schema=public",
  APP_BASE_URL: "http://localhost:3000",
  UPLOAD_DIR: "./storage/uploads",
  CONFIDENTIAL_MODE_DEFAULT: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_service_role_test_key",
};

describe("auth environment", () => {
  it("requires the Supabase project URL", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL is required");
  });

  it("requires the Supabase publishable key", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  });

  it("requires the service role key only on the server env contract", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        SUPABASE_SERVICE_ROLE_KEY: undefined,
      }),
    ).toThrow("SUPABASE_SERVICE_ROLE_KEY is required");
  });

  it("parses valid Supabase auth env values", () => {
    expect(parseServerEnv(validEnv)).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_service_role_test_key",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-env.test.ts
```

Expected: FAIL because `parseServerEnv` does not yet require Supabase env vars.

- [ ] **Step 3: Install Supabase dependencies**

Run:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected: `package.json` and lockfile include both packages.

- [ ] **Step 4: Add env fields**

In `src/lib/env.ts`, extend `serverEnvSchema`:

```ts
const serverEnvSchema = z.object({
  OPENAI_API_KEY: requiredString("OPENAI_API_KEY is required"),
  DATABASE_URL: requiredUrl(
    "DATABASE_URL is required",
    "DATABASE_URL must be a valid URL",
  ).refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL must be a PostgreSQL connection string",
  ),
  APP_BASE_URL: requiredUrl(
    "APP_BASE_URL is required",
    "APP_BASE_URL must be a valid URL",
  ),
  UPLOAD_DIR: requiredString("UPLOAD_DIR is required"),
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl(
    "NEXT_PUBLIC_SUPABASE_URL is required",
    "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required",
  ),
  SUPABASE_SERVICE_ROLE_KEY: requiredString(
    "SUPABASE_SERVICE_ROLE_KEY is required",
  ),
  CONFIDENTIAL_MODE_DEFAULT: z
    .preprocess(
      (value) => (value === undefined || value === null ? "true" : value),
      z.enum(["true", "false"], {
        error: "CONFIDENTIAL_MODE_DEFAULT must be true or false",
      }),
    )
    .transform((value) => value === "true"),
});
```

- [ ] **Step 5: Run env tests**

Run:

```bash
npm test -- tests/unit/env.test.ts tests/unit/auth-env.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json package-lock.json src/lib/env.ts tests/unit/auth-env.test.ts
git commit -m "feat: add supabase auth environment contract"
```

## Task 2: Build Auth Utility Modules

**Files:**
- Create: `src/lib/auth/email.ts`
- Create: `src/lib/auth/auth-errors.ts`
- Create: `src/lib/auth/supabase-browser.ts`
- Create: `src/lib/auth/supabase-server.ts`
- Create: `src/lib/auth/supabase-admin.ts`
- Test: `tests/unit/auth-email.test.ts`

- [ ] **Step 1: Write the failing email normalization test**

Create `tests/unit/auth-email.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  normalizeAuthEmail,
  isValidAuthEmail,
} from "@/lib/auth/email";

describe("auth email helpers", () => {
  it("normalizes allowlist emails before lookup", () => {
    expect(normalizeAuthEmail("  ShanZiTong@Example.COM  ")).toBe(
      "shanzitong@example.com",
    );
  });

  it("rejects empty or malformed emails", () => {
    expect(isValidAuthEmail("")).toBe(false);
    expect(isValidAuthEmail("not-an-email")).toBe(false);
    expect(isValidAuthEmail("valid@example.com")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-email.test.ts
```

Expected: FAIL because `src/lib/auth/email.ts` does not exist.

- [ ] **Step 3: Implement email helpers**

Create `src/lib/auth/email.ts`:

```ts
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAuthEmail(email: string) {
  return emailPattern.test(normalizeAuthEmail(email));
}
```

- [ ] **Step 4: Add typed auth errors**

Create `src/lib/auth/auth-errors.ts`:

```ts
export class AuthRequiredError extends Error {
  status = 401;
  code = "AUTH_REQUIRED";

  constructor(message = "请先登录") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class AuthNotAllowedError extends Error {
  status = 403;
  code = "AUTH_NOT_ALLOWED";

  constructor(message = "该邮箱不在访问白名单中") {
    super(message);
    this.name = "AuthNotAllowedError";
  }
}

export class ProfileSyncError extends Error {
  status = 500;
  code = "PROFILE_SYNC_FAILED";

  constructor(message = "用户档案同步失败") {
    super(message);
    this.name = "ProfileSyncError";
  }
}
```

- [ ] **Step 5: Add Supabase clients**

Create `src/lib/auth/supabase-browser.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

Create `src/lib/auth/supabase-server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getServerEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

Create `src/lib/auth/supabase-admin.ts`:

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- tests/unit/auth-email.test.ts tests/unit/auth-env.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/auth tests/unit/auth-email.test.ts
git commit -m "feat: add supabase auth helpers"
```

## Task 3: Add Allowlist and Profile Sync Logic

**Files:**
- Create: `src/lib/auth/allowlist.ts`
- Test: `tests/unit/auth-allowlist.test.ts`

- [ ] **Step 1: Write the failing allowlist tests**

Create `tests/unit/auth-allowlist.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import {
  assertAllowedEmail,
  syncUserProfile,
} from "@/lib/auth/allowlist";
import { AuthNotAllowedError } from "@/lib/auth/auth-errors";

const allowedUserRow = {
  id: "allow_1",
  email: "friend@example.com",
  status: "ACTIVE",
};

function createAdminClient(row: unknown, upsertError: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eqStatus = vi.fn().mockReturnValue({ maybeSingle });
  const eqEmail = vi.fn().mockReturnValue({ eq: eqStatus });
  const select = vi.fn().mockReturnValue({ eq: eqEmail });
  const upsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });

  return {
    from: vi.fn((table: string) => {
      if (table === "AllowedUser") {
        return { select };
      }

      return {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "profile_1",
                authUserId: "00000000-0000-4000-8000-000000000001",
                email: "friend@example.com",
              },
              error: upsertError,
            }),
          }),
        }),
      };
    }),
    __select: select,
    __eqEmail: eqEmail,
    __eqStatus: eqStatus,
    __maybeSingle: maybeSingle,
    __upsert: upsert,
  };
}

describe("allowlist", () => {
  it("allows active allowlisted emails after normalization", async () => {
    const client = createAdminClient(allowedUserRow);

    await expect(
      assertAllowedEmail(client as never, " Friend@Example.COM "),
    ).resolves.toEqual(allowedUserRow);
  });

  it("blocks emails not in the allowlist", async () => {
    const client = createAdminClient(null);

    await expect(
      assertAllowedEmail(client as never, "outsider@example.com"),
    ).rejects.toBeInstanceOf(AuthNotAllowedError);
  });

  it("upserts the Supabase auth user as the app profile", async () => {
    const client = createAdminClient(allowedUserRow);

    const profile = await syncUserProfile(client as never, {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
      user_metadata: {
        full_name: "Rokid Friend",
        avatar_url: "https://example.com/avatar.png",
      },
    });

    expect(profile).toMatchObject({
      id: "profile_1",
      authUserId: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-allowlist.test.ts
```

Expected: FAIL because `allowlist.ts` does not exist.

- [ ] **Step 3: Implement allowlist logic**

Create `src/lib/auth/allowlist.ts`:

```ts
import type { User } from "@supabase/supabase-js";

import {
  AuthNotAllowedError,
  ProfileSyncError,
} from "@/lib/auth/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth/email";

type AdminClient = {
  from: (table: string) => {
    select?: (columns: string) => unknown;
    upsert?: (
      value: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => unknown;
  };
};

function queryBuilder<T>(value: unknown) {
  return value as {
    eq: (column: string, value: unknown) => unknown;
    maybeSingle: () => Promise<{ data: T | null; error: unknown }>;
    single: () => Promise<{ data: T | null; error: unknown }>;
    select: (columns: string) => unknown;
  };
}

export type AllowedUserRow = {
  id: string;
  email: string;
  status: "INVITED" | "ACTIVE" | "BLOCKED";
};

export async function assertAllowedEmail(
  adminClient: AdminClient,
  email: string,
) {
  const normalizedEmail = normalizeAuthEmail(email);
  const table = adminClient.from("AllowedUser");
  const select = queryBuilder<AllowedUserRow>(table.select?.("*"));
  const emailFilter = queryBuilder<AllowedUserRow>(
    select.eq("email", normalizedEmail),
  );
  const statusFilter = queryBuilder<AllowedUserRow>(
    emailFilter.eq("status", "ACTIVE"),
  );
  const { data, error } = await statusFilter.maybeSingle();

  if (error || !data) {
    throw new AuthNotAllowedError();
  }

  return data;
}

export async function syncUserProfile(adminClient: AdminClient, user: User) {
  const email = user.email ? normalizeAuthEmail(user.email) : "";

  if (!email) {
    throw new AuthNotAllowedError("登录账号缺少邮箱，无法校验白名单");
  }

  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : email.split("@")[0] ?? "Rokid User";
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const table = adminClient.from("UserProfile");
  const upsert = queryBuilder<{
    id: string;
    authUserId: string;
    email: string;
  }>(
    table.upsert?.(
      {
        authUserId: user.id,
        email,
        name: displayName,
        avatarUrl,
        role: "Rokid 海外销售",
      },
      { onConflict: "authUserId" },
    ),
  );
  const selected = queryBuilder<{
    id: string;
    authUserId: string;
    email: string;
  }>(
    upsert.select("*"),
  );
  const { data, error } = await selected.single();

  if (error || !data) {
    throw new ProfileSyncError();
  }

  return data;
}
```

- [ ] **Step 4: Run allowlist tests**

Run:

```bash
npm test -- tests/unit/auth-allowlist.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/auth/allowlist.ts tests/unit/auth-allowlist.test.ts
git commit -m "feat: add auth allowlist profile sync"
```

## Task 4: Create Auth Database Migration and RLS Tests

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260524_auth_phase1/migration.sql`
- Create: `tests/unit/auth-rls-migration.test.ts`

- [ ] **Step 1: Write the failing migration contract test**

Create `tests/unit/auth-rls-migration.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "prisma/migrations/20260524_auth_phase1/migration.sql",
);

describe("auth phase 1 RLS migration", () => {
  it("enables RLS on direct user-owned tables", () => {
    const sql = readFileSync(migrationPath, "utf8");

    [
      '"UserProfile"',
      '"Material"',
      '"PrepCard"',
      '"PracticeSession"',
      '"Phrase"',
      '"WeaknessMetric"',
      '"AllowedUser"',
    ].forEach((table) => {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    });
  });

  it("uses auth.uid for user-owned data policies", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain('(select auth.uid())');
    expect(sql).toContain('profile."authUserId" = (select auth.uid())');
    expect(sql).toContain('profile.id = "Material"."ownerId"');
  });

  it("protects indirect transcript and review rows through PracticeSession", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain('from public."PracticeSession" session');
    expect(sql).toContain('profile.id = session."userId"');
    expect(sql).toContain('profile."authUserId" = (select auth.uid())');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-rls-migration.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Update Prisma schema**

In `prisma/schema.prisma`, add:

```prisma
enum AllowedUserStatus {
  INVITED
  ACTIVE
  BLOCKED
}

model AllowedUser {
  id          String            @id @default(cuid())
  email       String            @unique
  status      AllowedUserStatus @default(INVITED)
  invitedBy   String?
  invitedAt   DateTime          @default(now())
  activatedAt DateTime?
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([status])
}
```

Update `UserProfile`:

```prisma
model UserProfile {
  id                  String            @id @default(cuid())
  authUserId          String?           @unique @db.Uuid
  email               String?           @unique
  name                String
  avatarUrl           String?
  role                String
  englishLevel        String            @default("B2")
  trainingPreferences Json              @default("{}")
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  materials           Material[]
  prepCards           PrepCard[]
  practiceSessions    PracticeSession[]
  phrases             Phrase[]
  weaknesses          WeaknessMetric[]
}
```

Keep direct user foreign keys as existing `String` references to `UserProfile.id`. The RLS policies join those fields to `UserProfile.authUserId`, so this migration does not rewrite existing primary keys or foreign keys.

- [ ] **Step 4: Create the RLS migration SQL**

Create `prisma/migrations/20260524_auth_phase1/migration.sql` with:

```sql
create table if not exists public."AllowedUser" (
  id text primary key,
  email text not null unique,
  status text not null default 'INVITED',
  "invitedBy" text,
  "invitedAt" timestamptz not null default now(),
  "activatedAt" timestamptz,
  notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "AllowedUser_status_check"
    check (status in ('INVITED', 'ACTIVE', 'BLOCKED'))
);

create index if not exists "AllowedUser_status_idx"
on public."AllowedUser"(status);

alter table public."UserProfile"
  add column if not exists "authUserId" uuid,
  add column if not exists email text,
  add column if not exists "avatarUrl" text;

alter table public."UserProfile"
  alter column id set default ('profile_' || gen_random_uuid()::text);

create unique index if not exists "UserProfile_authUserId_key"
on public."UserProfile"("authUserId");

create unique index if not exists "UserProfile_email_key"
on public."UserProfile"(email);

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
```

- [ ] **Step 5: Run migration tests and Prisma validation**

Run:

```bash
npm test -- tests/unit/auth-rls-migration.test.ts
npm run prisma:format
npm run prisma:validate
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add prisma/schema.prisma prisma/migrations/20260524_auth_phase1/migration.sql tests/unit/auth-rls-migration.test.ts
git commit -m "feat: add auth schema and rls policies"
```

## Task 5: Implement Auth Context Guard

**Files:**
- Create: `src/lib/auth/require-user.ts`
- Test: `tests/unit/require-user.test.ts`

- [ ] **Step 1: Write the failing guard tests**

Create `tests/unit/require-user.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { AuthRequiredError } from "@/lib/auth/auth-errors";
import {
  requireAuthContextFromClients,
  requireUserFromClient,
} from "@/lib/auth/require-user";

describe("requireUserFromClient", () => {
  it("returns the authenticated user", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
    };
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    };

    await expect(requireUserFromClient(client as never)).resolves.toBe(user);
  });

  it("throws when no authenticated user exists", async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    await expect(requireUserFromClient(client as never)).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
  });

  it("returns profileId and authUserId for API data scoping", async () => {
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "00000000-0000-4000-8000-000000000001",
              email: "friend@example.com",
            },
          },
          error: null,
        }),
      },
    };
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "profile_1",
                authUserId: "00000000-0000-4000-8000-000000000001",
                email: "friend@example.com",
              },
              error: null,
            }),
          }),
        }),
      })),
    };

    await expect(
      requireAuthContextFromClients(authClient as never, adminClient as never),
    ).resolves.toMatchObject({
      authUserId: "00000000-0000-4000-8000-000000000001",
      profileId: "profile_1",
      email: "friend@example.com",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/require-user.test.ts
```

Expected: FAIL because `require-user.ts` does not exist.

- [ ] **Step 3: Implement guard**

Create `src/lib/auth/require-user.ts`:

```ts
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  AuthRequiredError,
  ProfileSyncError,
} from "@/lib/auth/auth-errors";
import { createSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

type ClientWithAuth = Pick<SupabaseClient, "auth">;
type ProfileClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        single: () => Promise<{
          data: { id: string; authUserId: string; email: string | null } | null;
          error: unknown;
        }>;
      };
    };
  };
};

export type AuthContext = {
  user: User;
  authUserId: string;
  profileId: string;
  email: string;
};

export async function requireUserFromClient(client: ClientWithAuth) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new AuthRequiredError();
  }

  return user as User;
}

export async function requireUser() {
  const client = await createSupabaseServerClient();

  return requireUserFromClient(client);
}

export async function requireAuthContextFromClients(
  authClient: ClientWithAuth,
  adminClient: ProfileClient,
): Promise<AuthContext> {
  const user = await requireUserFromClient(authClient);
  const { data, error } = await adminClient
    .from("UserProfile")
    .select("id, authUserId, email")
    .eq("authUserId", user.id)
    .single();

  if (error || !data) {
    throw new ProfileSyncError("用户档案不存在，请重新登录");
  }

  return {
    user,
    authUserId: user.id,
    profileId: data.id,
    email: data.email ?? user.email ?? "",
  };
}

export async function requireAuthContext() {
  const authClient = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  return requireAuthContextFromClients(authClient, adminClient);
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/unit/require-user.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/auth/require-user.ts tests/unit/require-user.test.ts
git commit -m "feat: add authenticated user context guard"
```

## Task 6: Implement OAuth Callback and Logout APIs

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Test: `tests/api/auth-callback.test.ts`
- Test: `tests/api/auth-logout.test.ts`

- [ ] **Step 1: Write failing callback tests**

Create `tests/api/auth-callback.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/auth/supabase-admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/allowlist", () => ({
  assertAllowedEmail: vi.fn(),
  syncUserProfile: vi.fn(),
}));

import { GET } from "@/app/auth/callback/route";
import { assertAllowedEmail, syncUserProfile } from "@/lib/auth/allowlist";
import { createSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges the OAuth code, checks allowlist, syncs profile, and redirects", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
      user_metadata: {},
    };
    const auth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signOut: vi.fn(),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue({} as never);
    vi.mocked(assertAllowedEmail).mockResolvedValue({
      id: "allow_1",
      email: "friend@example.com",
      status: "ACTIVE",
    });
    vi.mocked(syncUserProfile).mockResolvedValue({
      id: "profile_1",
      authUserId: user.id,
      email: user.email,
    } as never);

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc&next=/practice"),
    );

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(assertAllowedEmail).toHaveBeenCalledWith({}, "friend@example.com");
    expect(syncUserProfile).toHaveBeenCalledWith({}, user);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/practice");
  });

  it("signs out and redirects when the email is not allowlisted", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "00000000-0000-4000-8000-000000000001",
            email: "outsider@example.com",
            user_metadata: {},
          },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue({} as never);
    vi.mocked(assertAllowedEmail).mockRejectedValue(new Error("blocked"));

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc"),
    );

    expect(auth.signOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=not_allowed",
    );
  });
});
```

- [ ] **Step 2: Write failing logout test**

Create `tests/api/auth-logout.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { POST } from "@/app/api/auth/logout/route";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

describe("POST /api/auth/logout", () => {
  it("signs out the current Supabase session", async () => {
    const auth = {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);

    const response = await POST();

    expect(auth.signOut).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- tests/api/auth-callback.test.ts tests/api/auth-logout.test.ts
```

Expected: FAIL because the routes do not exist.

- [ ] **Step 4: Implement callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";

import {
  assertAllowedEmail,
  syncUserProfile,
} from "@/lib/auth/allowlist";
import { createSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const loginUrl = new URL("/login", requestUrl.origin);

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  );

  if (exchangeError) {
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "missing_email");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const admin = createSupabaseAdminClient();
    await assertAllowedEmail(admin, user.email);
    await syncUserProfile(admin, user);
  } catch {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
```

- [ ] **Step 5: Implement logout route**

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- tests/api/auth-callback.test.ts tests/api/auth-logout.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/app/auth/callback/route.ts src/app/api/auth/logout/route.ts tests/api/auth-callback.test.ts tests/api/auth-logout.test.ts
git commit -m "feat: add auth callback and logout"
```

## Task 7: Build Login UI

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/features/auth/login-view.tsx`
- Test: `tests/unit/auth-login-view.test.tsx`

- [ ] **Step 1: Write the failing login UI test**

Create `tests/unit/auth-login-view.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

import { LoginView } from "@/features/auth/login-view";

describe("LoginView", () => {
  it("shows Google login and allowlist guidance", () => {
    render(<LoginView />);

    expect(screen.getByRole("button", { name: /Google 快捷登录/ })).toBeVisible();
    expect(screen.getByText(/仅白名单邮箱可以访问/)).toBeVisible();
  });

  it("shows the not allowed message from callback errors", () => {
    render(<LoginView error="not_allowed" />);

    expect(screen.getByText(/该邮箱不在访问白名单中/)).toBeVisible();
  });

  it("starts Google OAuth when clicked", async () => {
    render(<LoginView />);

    await userEvent.click(screen.getByRole("button", { name: /Google 快捷登录/ }));

    expect(screen.getByRole("button", { name: /正在打开 Google/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-login-view.test.tsx
```

Expected: FAIL because the login view does not exist.

- [ ] **Step 3: Implement login view**

Create `src/features/auth/login-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Chrome, LogIn } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

const errorMessages: Record<string, string> = {
  not_allowed: "该邮箱不在访问白名单中，请联系管理员添加。",
  oauth_failed: "Google 登录失败，请稍后重试。",
  missing_email: "登录账号缺少邮箱，暂时无法校验白名单。",
  missing_code: "登录回调缺少授权码，请重新登录。",
};

export function LoginView({ error }: { error?: string }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const message = error ? errorMessages[error] : undefined;

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const next = new URLSearchParams(window.location.search).get("next");
    const callbackUrl = new URL("/auth/callback", origin);

    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">Rokid Coach</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">登录练习系统</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          仅白名单邮箱可以访问。登录后你的材料、练习、表达库和复盘会按账号隔离保存。
        </p>
        {message ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}
        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-base font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGoogleLoading}
          onClick={handleGoogleLogin}
          type="button"
        >
          {isGoogleLoading ? <LogIn size={20} /> : <Chrome size={20} />}
          {isGoogleLoading ? "正在打开 Google" : "Google 快捷登录"}
        </button>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Implement login page**

Create `src/app/login/page.tsx`:

```tsx
import { LoginView } from "@/features/auth/login-view";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return <LoginView error={params.error} />;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/unit/auth-login-view.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/login/page.tsx src/features/auth/login-view.tsx tests/unit/auth-login-view.test.tsx
git commit -m "feat: add auth login screen"
```

## Task 8: Protect Pages with Middleware

**Files:**
- Create: `src/middleware.ts`
- Test: `tests/api/auth-protected-routes.test.ts`

- [ ] **Step 1: Write the failing route protection tests**

Create `tests/api/auth-protected-routes.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })),
}));

import { middleware } from "@/middleware";

function requestFor(pathname: string) {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`));
}

describe("auth middleware", () => {
  it("redirects protected pages to login when no session exists", async () => {
    const response = await middleware(requestFor("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard",
    );
  });

  it("does not redirect public auth pages", async () => {
    const response = await middleware(requestFor("/login"));

    expect(response.status).not.toBe(307);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/api/auth-protected-routes.test.ts
```

Expected: FAIL because `src/middleware.ts` does not exist.

- [ ] **Step 3: Implement middleware**

Create `src/middleware.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPrefixes = [
  "/dashboard",
  "/materials",
  "/memory",
  "/objection-bank",
  "/phrasebook",
  "/practice",
  "/progress",
  "/reviews",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|auth/callback).*)",
  ],
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/api/auth-protected-routes.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/middleware.ts tests/api/auth-protected-routes.test.ts
git commit -m "feat: protect app pages with auth middleware"
```

## Task 9: Protect Business APIs

**Files:**
- Modify: `src/app/api/materials/route.ts`
- Modify: `src/app/api/materials/[materialId]/route.ts`
- Modify: `src/app/api/materials/[materialId]/brief/route.ts`
- Modify: `src/app/api/memories/route.ts`
- Modify: `src/app/api/memories/[memoryId]/route.ts`
- Modify: `src/app/api/phrasebook/route.ts`
- Modify: `src/app/api/practice-sessions/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/review/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/smart-guidance/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/suggested-answer/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/support-cue/route.ts`
- Modify: `src/app/api/practice-sessions/[sessionId]/transcript/route.ts`
- Modify: `src/app/api/prep-cards/route.ts`
- Modify: `src/app/api/realtime/session/route.ts`
- Modify: `src/app/api/review-analytics/route.ts`
- Modify: `src/app/api/subtitle-translation/route.ts`
- Modify: `src/app/api/today-recommendation/route.ts`
- Modify: `src/app/api/weaknesses/route.ts`
- Test: `tests/api/auth-business-routes.test.ts`

- [ ] **Step 1: Write failing API protection tests**

Create `tests/api/auth-business-routes.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-user", () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock("@/lib/materials/material-store", () => ({
  listMaterialRecords: vi.fn(() => []),
}));

import { GET as getMaterials } from "@/app/api/materials/route";
import { GET as getTodayRecommendation } from "@/app/api/today-recommendation/route";
import { requireAuthContext } from "@/lib/auth/require-user";

describe("business API auth protection", () => {
  it("returns 401 when materials are requested without login", async () => {
    vi.mocked(requireAuthContext).mockRejectedValueOnce(
      Object.assign(new Error("请先登录"), {
        status: 401,
        code: "AUTH_REQUIRED",
      }),
    );

    const response = await getMaterials();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "AUTH_REQUIRED",
      },
    });
  });

  it("checks login before generating today's recommendation", async () => {
    vi.mocked(requireAuthContext).mockResolvedValueOnce({
      authUserId: "00000000-0000-4000-8000-000000000001",
      profileId: "profile_1",
      email: "friend@example.com",
    } as never);

    await getTodayRecommendation(
      new Request("http://localhost:3000/api/today-recommendation?mock=1"),
    );

    expect(requireAuthContext).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/api/auth-business-routes.test.ts
```

Expected: FAIL because business API routes do not call `requireAuthContext()`.

- [ ] **Step 3: Add auth error handling**

In `src/lib/errors.ts`, extend `handleApiError` so auth errors return their status:

```ts
if (
  error instanceof Error &&
  "status" in error &&
  "code" in error &&
  typeof (error as { status: unknown }).status === "number"
) {
  return apiErrorResponse(
    String((error as { code: unknown }).code),
    error.message,
    (error as { status: number }).status,
  );
}
```

- [ ] **Step 4: Protect `src/app/api/materials/route.ts`**

Update the route:

```ts
import { requireAuthContext } from "@/lib/auth/require-user";

export async function GET() {
  try {
    const authContext = await requireAuthContext();

    return NextResponse.json({
      materials: listMaterialRecords({ userId: authContext.profileId }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    // keep existing form parsing
    const material = saveMaterialRecord(
      {
        ...input,
        userId: authContext.profileId,
        extractionStatus: extraction.status,
        extractedText: extraction.text ?? undefined,
        processingStatus:
          extraction.status === "extracted"
            ? "processing"
            : "processing_not_supported_yet",
      },
    );
    // keep existing response
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 5: Protect `src/app/api/practice-sessions/route.ts`**

Update the route:

```ts
import { requireAuthContext } from "@/lib/auth/require-user";

export async function GET() {
  try {
    const authContext = await requireAuthContext();

    return NextResponse.json({
      practiceSessions: listPracticeSessionRecords({
        userId: authContext.profileId,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const input = createPracticeSessionInputSchema.parse(
      await readJsonBody(request),
    );
    const practiceSession = createResolvedPracticeSession({
      ...input,
      userId: authContext.profileId,
    });

    return NextResponse.json({ practiceSession }, { status: 201 });
  } catch (error) {
    // keep existing error handling branch
  }
}
```

- [ ] **Step 6: Protect every protected business route**

Apply the auth guard to these exact files:

- `src/app/api/materials/[materialId]/route.ts`
- `src/app/api/materials/[materialId]/brief/route.ts`
- `src/app/api/memories/route.ts`
- `src/app/api/memories/[memoryId]/route.ts`
- `src/app/api/phrasebook/route.ts`
- `src/app/api/practice-sessions/[sessionId]/route.ts`
- `src/app/api/practice-sessions/[sessionId]/review/route.ts`
- `src/app/api/practice-sessions/[sessionId]/smart-guidance/route.ts`
- `src/app/api/practice-sessions/[sessionId]/suggested-answer/route.ts`
- `src/app/api/practice-sessions/[sessionId]/support-cue/route.ts`
- `src/app/api/practice-sessions/[sessionId]/transcript/route.ts`
- `src/app/api/prep-cards/route.ts`
- `src/app/api/realtime/session/route.ts`
- `src/app/api/review-analytics/route.ts`
- `src/app/api/subtitle-translation/route.ts`
- `src/app/api/today-recommendation/route.ts`
- `src/app/api/weaknesses/route.ts`

Each handler starts its `try` block with:

```ts
const authContext = await requireAuthContext();
```

Then pass `authContext.profileId` into store calls that list, create, update, or delete private data. For model-analysis endpoints such as subtitle translation and support cues, the guard is still required to prevent anonymous usage of paid model APIs.

Public exceptions remain:

- `src/app/api/health/route.ts`
- `src/app/auth/callback/route.ts`
- `src/app/api/auth/logout/route.ts` uses Supabase sign-out instead of `requireAuthContext()`.

- [ ] **Step 7: Run API protection tests**

Run:

```bash
npm test -- tests/api/auth-business-routes.test.ts tests/api/base-routes.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/app/api src/lib/errors.ts tests/api/auth-business-routes.test.ts
git commit -m "feat: require auth for business api routes"
```

## Task 10: Add User Scope to In-Memory Stores

**Files:**
- Modify: `src/lib/materials/material-store.ts`
- Modify: `src/lib/practice/practice-session-store.ts`
- Modify: `src/lib/memory/memory-store.ts`
- Modify: `src/lib/phrasebook/phrasebook-store.ts`
- Modify: `src/lib/progress/weakness-store.ts`
- Modify: `src/lib/progress/review-analytics-store.ts`
- Test: `tests/unit/user-scoped-stores.test.ts`

- [ ] **Step 1: Write failing user-scope tests**

Create `tests/unit/user-scoped-stores.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  listMaterialRecords,
  saveMaterialRecord,
} from "@/lib/materials/material-store";
import {
  listPracticeSessionRecords,
  savePracticeSessionRecord,
} from "@/lib/practice/practice-session-store";

describe("user-scoped stores", () => {
  it("only lists materials owned by the requested user", () => {
    saveMaterialRecord({
      userId: "profile_1",
      name: "Alice Deck",
      fileType: "pdf",
      originalFileName: "alice.pdf",
      storagePath: "/tmp/alice.pdf",
      confidentialMode: true,
    });
    saveMaterialRecord({
      userId: "profile_2",
      name: "Bob Deck",
      fileType: "pdf",
      originalFileName: "bob.pdf",
      storagePath: "/tmp/bob.pdf",
      confidentialMode: true,
    });

    expect(
      listMaterialRecords({
        userId: "profile_1",
      }).map((material) => material.name),
    ).toContain("Alice Deck");
    expect(
      listMaterialRecords({
        userId: "profile_1",
      }).map((material) => material.name),
    ).not.toContain("Bob Deck");
  });

  it("only lists practice sessions owned by the requested user", () => {
    savePracticeSessionRecord({
      userId: "profile_1",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "customer_qa",
      mode: "customer_qa",
      personaId: "technical_lead",
      voicePackId: "kore-firm",
      materialMode: "no_material",
      difficulty: "normal",
      trainingFocus: ["privacy"],
      focusTags: ["隐私安全"],
    });
    savePracticeSessionRecord({
      userId: "profile_2",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "demo_walkthrough",
      mode: "presentation_rehearsal",
      personaId: "enterprise_buyer",
      voicePackId: "leda-natural",
      materialMode: "no_material",
      difficulty: "normal",
      trainingFocus: ["scenario"],
      focusTags: ["应用场景"],
    });

    expect(
      listPracticeSessionRecords({
        userId: "profile_1",
      }),
    ).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/user-scoped-stores.test.ts
```

Expected: FAIL because store records are currently global and do not require `userId`.

- [ ] **Step 3: Update material store**

In `src/lib/materials/material-store.ts`, add `userId`:

```ts
export type MaterialRecord = CreateMaterialInput & {
  id: string;
  userId: string;
  processingStatus: MaterialProcessingStatus;
  memoryStatus: MaterialMemoryStatus;
  extractedText?: string;
  extractionStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export function listMaterialRecords(scope?: { userId?: string }) {
  const records = Array.from(materialRecords.values());
  const scopedRecords = scope?.userId
    ? records.filter((material) => material.userId === scope.userId)
    : records;

  return scopedRecords.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function saveMaterialRecord(
  input: CreateMaterialInput & {
    userId: string;
    processingStatus?: MaterialProcessingStatus;
    memoryStatus?: MaterialMemoryStatus;
    extractedText?: string;
    extractionStatus?: string;
  },
) {
  // keep existing body and spread input into material
}
```

- [ ] **Step 4: Update practice session store**

In `src/lib/practice/practice-session-store.ts`, add `userId` to `PracticeSessionRecord` and filtering:

```ts
export type PracticeSessionRecord = Omit<
  CreatePracticeSessionInput,
  "materialMode"
> & {
  id: string;
  userId: string;
  materialMode?: CreatePracticeSessionInput["materialMode"];
  status: "created" | "active" | "completed" | "reviewed";
  resolvedContext?: ResolvedPracticeContext;
  createdAt: string;
  updatedAt?: string;
};

export function listPracticeSessionRecords(scope?: { userId?: string }) {
  const records = Array.from(practiceSessions.values());
  const scopedRecords = scope?.userId
    ? records.filter((session) => session.userId === scope.userId)
    : records;

  return scopedRecords.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}
```

Update `ensurePracticeSessionRecord` fallback so it requires or defaults a local-only user:

```ts
userId: fallback?.userId ?? "profile_local_demo",
```

- [ ] **Step 5: Update memory store**

In `src/lib/memory/memory-store.ts`, every memory record must carry `userId`. Listing and ranking functions accept scope:

```ts
type UserScope = { userId: string };

export function listMemoryRecords(scope: UserScope) {
  return Array.from(memoryRecords.values())
    .filter((memory) => memory.userId === scope.userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function rankMemoriesForPractice(
  input: { focusTags: string[]; limit: number },
  scope: UserScope,
) {
  return listMemoryRecords(scope)
    .map((memory) => ({
      memory,
      score: input.focusTags.filter((tag) => memory.tags.includes(tag)).length,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit)
    .map((item) => item.memory);
}
```

- [ ] **Step 6: Update phrasebook store**

In `src/lib/phrasebook/phrasebook-store.ts`, require `userId` on create and filter on read:

```ts
type UserScope = { userId: string };

export function listPhraseRecords(scope: UserScope) {
  return Array.from(phraseRecords.values())
    .filter((phrase) => phrase.userId === scope.userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function deletePhraseRecord(phraseId: string, scope: UserScope) {
  const phrase = phraseRecords.get(phraseId);

  if (!phrase || phrase.userId !== scope.userId) {
    return null;
  }

  phraseRecords.delete(phraseId);
  return phrase;
}
```

- [ ] **Step 7: Update weakness and analytics stores**

In `src/lib/progress/weakness-store.ts`, scope progress by user:

```ts
type UserScope = { userId: string };

export function getProgressSummary(
  recentTrainingCount: number,
  scope: UserScope,
) {
  const scopedWeaknesses = Array.from(weaknessRecords.values()).filter(
    (weakness) => weakness.userId === scope.userId,
  );

  return buildProgressSummary(scopedWeaknesses, recentTrainingCount);
}
```

In `src/lib/progress/review-analytics-store.ts`, cache keys include user:

```ts
export function reviewAnalyticsCacheKey(
  userId: string,
  range: "7d" | "30d" | "all",
) {
  return `${userId}:${range}`;
}
```

- [ ] **Step 8: Update review-linked records**

In `src/lib/practice/practice-session-store.ts`, make review, transcript, and suggested-answer access validate session ownership:

```ts
type UserScope = { userId: string };

export function getTranscriptTurns(sessionId: string, scope: UserScope) {
  const session = getPracticeSessionRecord(sessionId);

  if (!session || session.userId !== scope.userId) {
    return [];
  }

  return transcriptTurns.get(sessionId) ?? [];
}

export function getReviewBySessionId(sessionId: string, scope: UserScope) {
  const session = getPracticeSessionRecord(sessionId);

  if (!session || session.userId !== scope.userId) {
    return null;
  }

  return (
    Array.from(reviewRecords.values()).find(
      (review) => review.sessionId === sessionId,
    ) ?? null
  );
}
```

- [ ] **Step 9: Run tests**

Run:

```bash
npm test -- tests/unit/user-scoped-stores.test.ts tests/api/auth-business-routes.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/lib tests/unit/user-scoped-stores.test.ts
git commit -m "feat: scope in-memory records by authenticated user"
```

## Task 11: Split Public Login and Authenticated App Layouts

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/(app)/layout.tsx`
- Move: `src/app/dashboard/page.tsx` to `src/app/(app)/dashboard/page.tsx`
- Move: `src/app/materials/page.tsx` to `src/app/(app)/materials/page.tsx`
- Move: `src/app/memory/page.tsx` to `src/app/(app)/memory/page.tsx`
- Move: `src/app/objection-bank/page.tsx` to `src/app/(app)/objection-bank/page.tsx`
- Move: `src/app/phrasebook/page.tsx` to `src/app/(app)/phrasebook/page.tsx`
- Move: `src/app/practice/page.tsx` to `src/app/(app)/practice/page.tsx`
- Move: `src/app/practice/[sessionId]/page.tsx` to `src/app/(app)/practice/[sessionId]/page.tsx`
- Move: `src/app/progress/page.tsx` to `src/app/(app)/progress/page.tsx`
- Move: `src/app/reviews/[reviewId]/page.tsx` to `src/app/(app)/reviews/[reviewId]/page.tsx`
- Move: `src/app/settings/page.tsx` to `src/app/(app)/settings/page.tsx`
- Test: `tests/unit/auth-layout.test.tsx`

- [ ] **Step 1: Write failing layout test**

Create `tests/unit/auth-layout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app-sidebar", () => ({
  AppSidebar: () => <aside>sidebar</aside>,
}));

import RootLayout from "@/app/layout";
import AppLayout from "@/app/(app)/layout";

describe("auth route group layouts", () => {
  it("keeps the root layout free of the app sidebar", () => {
    render(
      <RootLayout>
        <div>login content</div>
      </RootLayout>,
    );

    expect(screen.getByText("login content")).toBeVisible();
    expect(screen.queryByText("sidebar")).not.toBeInTheDocument();
  });

  it("renders the sidebar only in the authenticated app layout", () => {
    render(
      <AppLayout>
        <div>dashboard content</div>
      </AppLayout>,
    );

    expect(screen.getByText("sidebar")).toBeVisible();
    expect(screen.getByText("dashboard content")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-layout.test.tsx
```

Expected: FAIL because `src/app/(app)/layout.tsx` does not exist and root layout still includes the sidebar.

- [ ] **Step 3: Create route groups**

Move authenticated pages to:

```text
src/app/(app)/dashboard/page.tsx
src/app/(app)/materials/page.tsx
src/app/(app)/memory/page.tsx
src/app/(app)/objection-bank/page.tsx
src/app/(app)/phrasebook/page.tsx
src/app/(app)/practice/page.tsx
src/app/(app)/practice/[sessionId]/page.tsx
src/app/(app)/progress/page.tsx
src/app/(app)/reviews/[reviewId]/page.tsx
src/app/(app)/settings/page.tsx
```

Create `src/app/(app)/layout.tsx`:

```tsx
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-grid">
      <AppSidebar />
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

Then reduce `src/app/layout.tsx` to the HTML/body wrapper:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Rokid 海外会议口语教练",
  description:
    "A tailored English meeting coach for Rokid overseas sales and solution conversations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Run smoke tests**

Run:

```bash
npm test -- tests/unit/static-views.test.tsx tests/unit/auth-login-view.test.tsx tests/unit/auth-layout.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app tests/unit/auth-layout.test.tsx
git commit -m "feat: separate login and app layouts"
```

## Task 12: Documentation and Deployment Checklist

**Files:**
- Modify: `docs/production-environment-setup.md`
- Modify: `docs/deployment-readiness.md`
- Create: `docs/auth-phase1-setup.md`

- [ ] **Step 1: Document Supabase Auth setup**

Create `docs/auth-phase1-setup.md`:

````md
# 账号与权限第一阶段配置教程

## Vercel 环境变量

- NEXT_PUBLIC_SUPABASE_URL: Supabase Project URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Supabase publishable key
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role key，只能服务端使用
- APP_BASE_URL: 生产站点 URL，例如 https://nega-yunana.vercel.app

## Supabase Google Provider

1. 在 Google Cloud 创建 OAuth Client。
2. Authorized redirect URI 填写 Supabase 提供的 callback URL。
3. 在 Supabase Dashboard > Authentication > Providers > Google 填写 Client ID 和 Client Secret。
4. 在 Supabase URL Configuration 中加入 https://nega-yunana.vercel.app/auth/callback。

## 白名单

在 Supabase SQL Editor 中插入允许访问的邮箱：

```sql
insert into public."AllowedUser" (id, email, status)
values ('allow_' || gen_random_uuid()::text, 'friend@example.com', 'ACTIVE')
on conflict (email) do update set status = 'ACTIVE';
```
````

- [ ] **Step 2: Update production docs**

Add the auth env vars and Google provider notes to `docs/production-environment-setup.md` and `docs/deployment-readiness.md`.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

- [ ] **Step 4: Manual verification**

Verify locally:

```bash
npm run dev
```

Manual checks:

- Open `http://localhost:3000/dashboard`; it redirects to `/login`.
- Click Google login with a white-listed test account; it returns to `/dashboard`.
- Click Google login with a non-white-listed account; it returns to `/login?error=not_allowed`.
- Open `/api/materials` without cookies; it returns `401`.
- Open `/api/materials` after login; it returns only the current user's records.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs
git commit -m "docs: add auth phase one setup guide"
```

## Final Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:

- Lint passes.
- TypeScript passes.
- Unit and API tests pass.
- Next.js production build passes.

## Deployment Notes

Before deploying:

- Add Supabase env vars to Vercel Production, Preview, and Development.
- Add the same Supabase env vars to Render only if the realtime relay needs authenticated Supabase calls. If Render remains only a Gemini relay, it does not need service role access.
- Configure Google OAuth redirect URLs for local and production.
- Seed `AllowedUser` with the friend's email before testing production login.
- Apply the database migration before turning on route protection in production.
