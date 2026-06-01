import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as uploadMaterial } from "@/app/api/materials/route";
import { GET as getMaterialBrief } from "@/app/api/materials/[materialId]/brief/route";

let uploadDir: string;

function routeContext(materialId: string) {
  return {
    params: {
      materialId,
    },
  };
}

function multipartRequest(formData: FormData) {
  return {
    formData: async () => formData,
  } as Request;
}

async function uploadTxtMaterial() {
  const formData = new FormData();
  formData.set("file", new File(["Rokid supports real-time translated captions."], "brief-source.txt"));
  formData.set("name", "Brief source");
  formData.set("customerType", "Enterprise buyer");
  formData.set("industry", "Education");
  formData.set("meetingGoal", "Prepare a solution meeting");

  const response = await uploadMaterial(multipartRequest(formData));
  const payload = (await response.json()) as { materialId: string };
  return payload.materialId;
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("material brief API", () => {
  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), "rokid-brief-"));
    vi.stubEnv("UPLOAD_DIR", uploadDir);
    vi.stubEnv("AI_MOCK_MODE", "true");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(uploadDir, { force: true, recursive: true });
  });

  it("generates and returns a ready Material Brief", async () => {
    const materialId = await uploadTxtMaterial();

    const response = await getMaterialBrief(
      new Request(`http://localhost/api/materials/${materialId}/brief`),
      routeContext(materialId),
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      materialId,
      status: "ready",
      brief: {
        keyMessage: expect.any(String),
        productPoints: expect.any(Array),
        customerValue: expect.any(Array),
        likelyQuestions: expect.any(Array),
        applicationScenarios: expect.any(Array),
        pros: expect.any(Array),
        cons: expect.any(Array),
        competitorDifferences: expect.any(Array),
        productParameters: expect.any(Array),
        memoryStatus: "session_only",
        likelyObjections: expect.any(Array),
        riskyClaims: expect.any(Array),
        usefulPhrases: expect.any(Array),
        glossary: expect.any(Array),
        outline: expect.any(Array),
      },
    });
  });

  it("returns not found for an unknown material", async () => {
    const response = await getMaterialBrief(
      new Request("http://localhost/api/materials/missing/brief"),
      routeContext("missing"),
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "NOT_FOUND",
        message: "未找到材料",
      },
    });
  });
});
