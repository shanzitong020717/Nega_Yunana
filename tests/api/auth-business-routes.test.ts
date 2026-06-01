import { afterEach, describe, expect, it, vi } from "vitest";

const { requireAuthContextMock } = vi.hoisted(() => ({
  requireAuthContextMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireAuthContext: requireAuthContextMock,
}));

import { GET as getMaterials } from "@/app/api/materials/route";
import { GET as getTodayRecommendation } from "@/app/api/today-recommendation/route";
import { saveMaterialRecord } from "@/lib/materials/material-store";

describe("authenticated business APIs", () => {
  afterEach(() => {
    requireAuthContextMock.mockReset();
  });

  it("returns 401 when a business API is requested without a user", async () => {
    requireAuthContextMock.mockRejectedValueOnce(
      Object.assign(new Error("请先登录"), {
        code: "AUTH_REQUIRED",
        status: 401,
      }),
    );

    const response = await getMaterials();
    const payload = (await response.json()) as {
      error?: { code: string; message: string };
    };

    expect(response.status).toBe(401);
    expect(payload.error).toEqual({
      code: "AUTH_REQUIRED",
      message: "请先登录",
    });
  });

  it("only returns materials owned by the logged-in profile", async () => {
    requireAuthContextMock.mockResolvedValueOnce({
      profileId: "profile_business_a",
    });
    saveMaterialRecord({
      userId: "profile_business_a",
      name: "Visible Material",
      fileType: "PDF",
      originalFileName: "visible.pdf",
      storagePath: "/tmp/visible.pdf",
      confidentialMode: true,
    });
    saveMaterialRecord({
      userId: "profile_business_b",
      name: "Hidden Material",
      fileType: "PDF",
      originalFileName: "hidden.pdf",
      storagePath: "/tmp/hidden.pdf",
      confidentialMode: true,
    });

    const response = await getMaterials();
    const payload = (await response.json()) as {
      materials: Array<{ name: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.materials.map((material) => material.name)).toContain(
      "Visible Material",
    );
    expect(payload.materials.map((material) => material.name)).not.toContain(
      "Hidden Material",
    );
  });

  it("uses the logged-in profile when building today's recommendation", async () => {
    requireAuthContextMock.mockResolvedValueOnce({
      profileId: "profile_today_recommendation",
    });

    const response = await getTodayRecommendation(
      new Request("http://localhost/api/today-recommendation?mock=1"),
    );

    expect(response.status).toBe(200);
    expect(requireAuthContextMock).toHaveBeenCalledTimes(1);
  });
});
