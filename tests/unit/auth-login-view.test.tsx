import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth,
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

  it("starts Google OAuth when clicked", () => {
    render(<LoginView />);

    fireEvent.click(screen.getByRole("button", { name: /Google 快捷登录/ }));

    expect(screen.getByRole("button", { name: /正在打开 Google/ })).toBeDisabled();
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });
});
