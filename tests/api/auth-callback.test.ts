import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/auth/allowlist", () => ({
  assertAllowedEmail: vi.fn(),
  syncUserProfile: vi.fn(),
}));

import { GET } from "@/app/auth/callback/route";
import { assertAllowedEmail, syncUserProfile } from "@/lib/auth/allowlist";
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

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc&next=/practice"),
    );

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(assertAllowedEmail).toHaveBeenCalledWith(
      supabaseClient,
      "friend@example.com",
    );
    expect(syncUserProfile).toHaveBeenCalledWith(supabaseClient, user);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/practice",
    );
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

  it("signs out and redirects when profile sync fails after allowlist passes", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "friend@example.com",
      user_metadata: {},
    };
    const auth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc"),
    );

    expect(auth.signOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=profile_sync_failed",
    );
  });
});
