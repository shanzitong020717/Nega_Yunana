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
