import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/auth/allowlist", () => ({
  assertAllowedEmail: vi.fn(),
  syncUserProfile: vi.fn(),
}));

import { POST } from "@/app/api/auth/sync-profile/route";
import { assertAllowedEmail, syncUserProfile } from "@/lib/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

describe("POST /api/auth/sync-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks the allowlist, syncs the profile, and returns ok", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
      user_metadata: {},
    };
    const auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signOut: vi.fn(),
    };
    const supabaseClient = { auth };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabaseClient as never,
    );
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

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(assertAllowedEmail).toHaveBeenCalledWith(
      supabaseClient,
      "friend@example.com",
    );
    expect(syncUserProfile).toHaveBeenCalledWith(supabaseClient, user);
  });

  it("signs out and returns not_allowed when the email is blocked", async () => {
    const auth = {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "00000000-0000-4000-8000-000000000001",
            email: "blocked@example.com",
            user_metadata: {},
          },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);
    vi.mocked(assertAllowedEmail).mockRejectedValue(new Error("blocked"));

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "not_allowed" });
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("signs out and returns profile_sync_failed when profile sync fails", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
      user_metadata: {},
    };
    const auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);
    vi.mocked(assertAllowedEmail).mockResolvedValue({
      id: "allow_1",
      email: "friend@example.com",
      status: "ACTIVE",
    });
    vi.mocked(syncUserProfile).mockRejectedValue(new Error("profile failed"));

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "profile_sync_failed",
    });
    expect(auth.signOut).toHaveBeenCalled();
  });
});
