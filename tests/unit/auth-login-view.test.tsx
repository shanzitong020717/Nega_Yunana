import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const signInWithIdToken = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithIdToken,
    },
  }),
}));

import { LoginView } from "@/features/auth/login-view";

describe("LoginView", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    delete (window as typeof window & { google?: unknown }).google;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("renders the Google Identity Services button when a client id is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "google-client-id");
    const initialize = vi.fn();
    const renderButton = vi.fn();
    (window as typeof window & { google?: unknown }).google = {
      accounts: {
        id: {
          initialize,
          renderButton,
        },
      },
    };

    render(<LoginView />);

    await waitFor(() => {
      expect(initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "google-client-id",
        }),
      );
      expect(renderButton).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          theme: "outline",
          size: "large",
          locale: "zh_CN",
        }),
      );
    });
  });
});
