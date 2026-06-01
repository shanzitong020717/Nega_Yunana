import { describe, expect, it, vi } from "vitest";

import { AuthRequiredError } from "@/lib/auth/auth-errors";
import {
  requireAuthContextFromClients,
  requireUserFromClient,
} from "@/lib/auth/require-user";

describe("auth context guard", () => {
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
    const profileSingle = vi.fn().mockResolvedValue({
      data: {
        id: "profile_1",
        authUserId: "00000000-0000-4000-8000-000000000001",
        email: "friend@example.com",
      },
      error: null,
    });
    const profileEq = vi.fn().mockReturnValue({
      single: profileSingle,
    });
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: profileEq,
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
    expect(profileEq).toHaveBeenCalledWith(
      "authUserId",
      "00000000-0000-4000-8000-000000000001",
    );
  });
});
