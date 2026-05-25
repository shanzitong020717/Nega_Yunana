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
  const allowlistMaybeSingle = vi.fn().mockResolvedValue({
    data: row,
    error: null,
  });
  const statusEq = vi.fn().mockReturnValue({
    maybeSingle: allowlistMaybeSingle,
  });
  const emailEq = vi.fn().mockReturnValue({
    eq: statusEq,
  });
  const allowlistSelect = vi.fn().mockReturnValue({
    eq: emailEq,
  });
  const profileSingle = vi.fn().mockResolvedValue({
    data: {
      id: "profile_1",
      authUserId: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
    },
    error: upsertError,
  });
  const profileSelect = vi.fn().mockReturnValue({
    single: profileSingle,
  });
  const profileUpsert = vi.fn().mockReturnValue({
    select: profileSelect,
  });

  return {
    from: vi.fn((table: string) => {
      if (table === "AllowedUser") {
        return { select: allowlistSelect };
      }

      return { upsert: profileUpsert };
    }),
    profileUpsert,
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
    } as never);

    expect(profile).toMatchObject({
      id: "profile_1",
      authUserId: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
    });
    expect(client.profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "profile_00000000000040008000000000000001",
        authUserId: "00000000-0000-4000-8000-000000000001",
        email: "friend@example.com",
        name: "Rokid Friend",
      }),
      { onConflict: "authUserId" },
    );
  });
});
