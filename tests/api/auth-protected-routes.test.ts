import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

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
