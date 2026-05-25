"use client";

import { useState } from "react";
import { LogIn, UserRound } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

const errorMessages: Record<string, string> = {
  missing_code: "登录回调缺少授权码，请重新登录。",
  missing_email: "登录账号缺少邮箱，暂时无法校验白名单。",
  not_allowed: "该邮箱不在访问白名单中，请联系管理员添加。",
  oauth_failed: "Google 登录失败，请稍后重试。",
  profile_sync_failed: "账号资料同步失败，请稍后重新登录。",
};

export function LoginView({ error }: { error?: string }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const message = error ? errorMessages[error] : undefined;

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
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
    }
  }

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
        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-base font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGoogleLoading}
          onClick={handleGoogleLogin}
          type="button"
        >
          {isGoogleLoading ? <LogIn size={20} /> : <UserRound size={20} />}
          {isGoogleLoading ? "正在打开 Google" : "Google 快捷登录"}
        </button>
      </section>
    </main>
  );
}
