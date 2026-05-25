"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

const errorMessages: Record<string, string> = {
  missing_code: "登录回调缺少授权码，请重新登录。",
  missing_email: "登录账号缺少邮箱，暂时无法校验白名单。",
  not_allowed: "该邮箱不在访问白名单中，请联系管理员添加。",
  oauth_failed: "Google 登录失败，请稍后重试。",
  profile_sync_failed: "账号资料同步失败，请稍后重新登录。",
};

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "signin_with";
          shape: "rectangular";
          logo_alignment: "left";
          width: number;
          locale: "zh_CN";
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

function safeNextPath(search: string) {
  const next = new URLSearchParams(search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 18 18" width="20">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.72H.94v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.7A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.02-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginView({ error }: { error?: string }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [clientError, setClientError] = useState<string | undefined>();
  const [isOfficialButtonReady, setIsOfficialButtonReady] = useState(false);
  const [didGoogleScriptFail, setDidGoogleScriptFail] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const message = clientError ?? (error ? errorMessages[error] : undefined);

  const redirectToLoginError = useCallback((code: string) => {
    const url = new URL("/login", window.location.origin);
    url.searchParams.set("error", code);
    window.location.assign(url.toString());
  }, []);

  const redirectToNextPath = useCallback(() => {
    window.location.assign(safeNextPath(window.location.search));
  }, []);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setClientError(undefined);
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
      setClientError(errorMessages.oauth_failed);
    }
  }

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const token = response.credential;

      if (!token) {
        setClientError(errorMessages.oauth_failed);
        return;
      }

      setIsGoogleLoading(true);
      setClientError(undefined);

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token,
      });

      if (signInError) {
        setIsGoogleLoading(false);
        setClientError(errorMessages.oauth_failed);
        return;
      }

      const syncResponse = await fetch("/api/auth/sync-profile", {
        method: "POST",
      });

      if (!syncResponse.ok) {
        const result = await syncResponse
          .json()
          .catch(() => ({ error: "profile_sync_failed" }));
        redirectToLoginError(result.error ?? "profile_sync_failed");
        return;
      }

      redirectToNextPath();
    },
    [redirectToLoginError, redirectToNextPath],
  );

  const renderGoogleButton = useCallback(() => {
    if (!googleClientId || !googleButtonRef.current || !window.google) {
      return;
    }

    const buttonWidth = Math.min(
      400,
      Math.max(280, googleButtonRef.current.clientWidth || 336),
    );

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      ux_mode: "popup",
      use_fedcm_for_prompt: true,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: buttonWidth,
      locale: "zh_CN",
    });
    setIsOfficialButtonReady(true);
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    if (window.google?.accounts.id) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );
    const script = existingScript ?? document.createElement("script");

    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      setDidGoogleScriptFail(true);
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }
  }, [googleClientId, renderGoogleButton]);

  const shouldShowFallbackButton =
    !googleClientId || didGoogleScriptFail || !isOfficialButtonReady;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">Rokid Coach</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          登录练习系统
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          仅白名单邮箱可以访问。登录后你的材料、练习、表达库和复盘会按账号隔离保存。
        </p>
        {message ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}
        {googleClientId ? (
          <div
            className={
              isOfficialButtonReady
                ? "mt-6 flex min-h-11 w-full justify-center"
                : "h-0 overflow-hidden"
            }
          >
            <div className="w-full max-w-[400px]" ref={googleButtonRef} />
          </div>
        ) : null}
        {shouldShowFallbackButton ? (
          <button
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            type="button"
          >
            {isGoogleLoading ? <LogIn size={20} /> : <GoogleLogo />}
            {isGoogleLoading ? "正在打开 Google" : "Google 快捷登录"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
