import type { User } from "@supabase/supabase-js";

import {
  AuthRequiredError,
  ProfileSyncError,
} from "@/lib/auth/auth-errors";
import { shouldBypassAuthForE2E } from "@/lib/auth/e2e-bypass";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { LOCAL_DEMO_PROFILE_ID } from "@/lib/auth/user-scope";

type AuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null };
      error: unknown;
    }>;
  };
};

type ProfileClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        single: () => Promise<{
          data: { id: string; authUserId: string; email: string | null } | null;
          error: unknown;
        }>;
      };
    };
  };
};

export type AuthContext = {
  user: User;
  authUserId: string;
  profileId: string;
  email: string;
};

export async function requireUserFromClient(client: AuthClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new AuthRequiredError();
  }

  return user;
}

export async function requireUser() {
  const client = await createSupabaseServerClient();

  return requireUserFromClient(client);
}

export async function requireAuthContextFromClients(
  authClient: AuthClient,
  adminClient: ProfileClient,
): Promise<AuthContext> {
  const user = await requireUserFromClient(authClient);
  const { data, error } = await adminClient
    .from("UserProfile")
    .select("id, authUserId, email")
    .eq("authUserId", user.id)
    .single();

  if (error || !data) {
    throw new ProfileSyncError("用户档案不存在，请重新登录");
  }

  return {
    user,
    authUserId: user.id,
    profileId: data.id,
    email: data.email ?? user.email ?? "",
  };
}

export async function requireAuthContext() {
  if (
    shouldBypassAuthForE2E() ||
    (process.env.NODE_ENV === "test" && !process.env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        email: "test@example.com",
      } as User,
      authUserId: "00000000-0000-0000-0000-000000000000",
      profileId: LOCAL_DEMO_PROFILE_ID,
      email: "test@example.com",
    };
  }

  const authClient = await createSupabaseServerClient();

  return requireAuthContextFromClients(
    authClient as unknown as AuthClient,
    authClient as unknown as ProfileClient,
  );
}
