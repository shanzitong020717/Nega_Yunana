import { describe, expect, it } from "vitest";

import {
  isValidAuthEmail,
  normalizeAuthEmail,
} from "@/lib/auth/email";

describe("auth email helpers", () => {
  it("normalizes allowlist emails before lookup", () => {
    expect(normalizeAuthEmail("  ShanZiTong@Example.COM  ")).toBe(
      "shanzitong@example.com",
    );
  });

  it("rejects empty or malformed emails", () => {
    expect(isValidAuthEmail("")).toBe(false);
    expect(isValidAuthEmail("not-an-email")).toBe(false);
    expect(isValidAuthEmail("valid@example.com")).toBe(true);
  });
});
