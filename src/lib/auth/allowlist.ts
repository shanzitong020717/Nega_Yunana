import type { User } from "@supabase/supabase-js";

import {
  AuthNotAllowedError,
  ProfileSyncError,
} from "@/lib/auth/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth/email";

type AllowedUserStatus = "INVITED" | "ACTIVE" | "BLOCKED";

export type AllowedUserRow = {
  id: string;
  email: string;
  status: AllowedUserStatus;
};

export type UserProfileRow = {
  id: string;
  authUserId: string;
  email: string;
};

type QueryResult<T> = Promise<{ data: T | null; error: unknown }>;

type AllowlistQuery = {
  eq: (column: string, value: unknown) => AllowlistQuery;
  maybeSingle: () => QueryResult<AllowedUserRow>;
};

type ProfileUpsertQuery = {
  select: (columns: string) => {
    single: () => QueryResult<UserProfileRow>;
  };
};

type AdminClient = {
  from: (table: string) => {
    select?: (columns: string) => AllowlistQuery;
    upsert?: (
      value: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => ProfileUpsertQuery;
  };
};

function profileIdForAuthUser(authUserId: string) {
  return `profile_${authUserId.replaceAll("-", "")}`;
}

export async function assertAllowedEmail(
  adminClient: AdminClient,
  email: string,
) {
  const normalizedEmail = normalizeAuthEmail(email);
  const table = adminClient.from("AllowedUser");
  const query = table.select?.("*");

  if (!query) {
    throw new AuthNotAllowedError();
  }

  const { data, error } = await query
    .eq("email", normalizedEmail)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) {
    throw new AuthNotAllowedError();
  }

  return data;
}

export async function syncUserProfile(adminClient: AdminClient, user: User) {
  const email = user.email ? normalizeAuthEmail(user.email) : "";

  if (!email) {
    throw new AuthNotAllowedError("登录账号缺少邮箱，无法校验白名单");
  }

  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : (email.split("@")[0] ?? "Rokid User");
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const table = adminClient.from("UserProfile");
  const query = table.upsert?.(
    {
      id: profileIdForAuthUser(user.id),
      authUserId: user.id,
      email,
      name: displayName,
      avatarUrl,
      role: "Rokid 海外销售",
    },
    { onConflict: "authUserId" },
  );

  if (!query) {
    throw new ProfileSyncError();
  }

  const { data, error } = await query.select("*").single();

  if (error || !data) {
    throw new ProfileSyncError();
  }

  return data;
}
