import { NextResponse } from "next/server";

import {
  assertAllowedEmail,
  syncUserProfile,
} from "@/lib/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

function safeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", requestUrl.origin);

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "missing_email");
    return NextResponse.redirect(loginUrl);
  }

  try {
    await assertAllowedEmail(supabase as never, user.email);
    await syncUserProfile(supabase as never, user);
  } catch {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(
    new URL(safeRedirectPath(requestUrl.searchParams.get("next")), requestUrl.origin),
  );
}
