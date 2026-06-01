export const LOCAL_DEMO_PROFILE_ID = "profile_local_demo";

export type UserScope = {
  userId?: string;
};

export function resolveScopedUserId(scope?: UserScope) {
  return scope?.userId ?? LOCAL_DEMO_PROFILE_ID;
}
