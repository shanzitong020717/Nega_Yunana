import { NextResponse } from "next/server";

import {
  assertAllowedEmail,
  syncUserProfile,
} from "@/lib/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "missing_email" }, { status: 401 });
  }

  try {
    await assertAllowedEmail(supabase as never, user.email);
  } catch {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  }

  try {
    await syncUserProfile(supabase as never, user);
  } catch {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "profile_sync_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
