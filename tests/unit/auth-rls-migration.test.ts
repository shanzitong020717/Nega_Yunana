import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "prisma/migrations/20260524_auth_phase1/migration.sql",
);

describe("auth phase 1 RLS migration", () => {
  it("enables RLS on user-owned tables", () => {
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
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
    });
  });

  it("uses auth.uid through UserProfile.authUserId for policies", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("(select auth.uid())");
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
