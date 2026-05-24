import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

const validEnv = {
  OPENAI_API_KEY: "sk-test-key",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/rokid_coach?schema=public",
  APP_BASE_URL: "http://localhost:3000",
  UPLOAD_DIR: "./storage/uploads",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
  CONFIDENTIAL_MODE_DEFAULT: "true",
};

describe("parseServerEnv", () => {
  it("returns a clear error when OPENAI_API_KEY is missing", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        OPENAI_API_KEY: undefined,
      }),
    ).toThrow(
      "OPENAI_API_KEY is required",
    );
  });

  it("normalizes CONFIDENTIAL_MODE_DEFAULT to a boolean", () => {
    expect(parseServerEnv(validEnv).CONFIDENTIAL_MODE_DEFAULT).toBe(true);
    expect(
      parseServerEnv({
        ...validEnv,
        CONFIDENTIAL_MODE_DEFAULT: "false",
      }).CONFIDENTIAL_MODE_DEFAULT,
    ).toBe(false);
  });
});
