import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

const validEnv = {
  OPENAI_API_KEY: "sk-test-key",
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5432/rokid_coach?schema=public",
  APP_BASE_URL: "http://localhost:3000",
  UPLOAD_DIR: "./storage/uploads",
  CONFIDENTIAL_MODE_DEFAULT: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
};

describe("auth environment", () => {
  it("requires the Supabase project URL", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL is required");
  });

  it("requires the Supabase publishable key", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  });

  it("parses valid Supabase auth env values", () => {
    expect(parseServerEnv(validEnv)).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    });
  });
});
