import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as uploadMaterial } from "@/app/api/materials/route";

let uploadDir: string;

function multipartRequest(formData: FormData) {
  return {
    formData: async () => formData,
  } as Request;
}

function validUploadForm() {
  const formData = new FormData();
  formData.set("file", new File(["Rokid demo notes"], "demo-notes.txt", { type: "text/plain" }));
  formData.set("name", "Rokid demo notes");
  formData.set("customerType", "Enterprise buyer");
  formData.set("industry", "Healthcare");
  formData.set("meetingGoal", "Qualify a pilot");
  formData.set("notes", "Practice privacy and IT review questions.");
  return formData;
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("materials upload API", () => {
  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), "rokid-materials-"));
    vi.stubEnv("UPLOAD_DIR", uploadDir);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(uploadDir, { force: true, recursive: true });
  });

  it("rejects unsupported file types before storage", async () => {
    const formData = validUploadForm();
    formData.set("file", new File(["video"], "demo.mp4", { type: "video/mp4" }));

    const response = await uploadMaterial(multipartRequest(formData));

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Unsupported file type",
      },
    });
  });

  it("stores an uploaded file and defaults confidential mode to true", async () => {
    const response = await uploadMaterial(multipartRequest(validUploadForm()));
    const storedFiles = await readdir(uploadDir);

    expect(response.status).toBe(201);
    expect(storedFiles).toHaveLength(1);
    expect(storedFiles[0]).toMatch(/^material_[a-f0-9-]+_demo-notes\.txt$/);
    await expect(readJson(response)).resolves.toMatchObject({
      materialId: expect.stringMatching(/^material_/),
      status: "processing",
      material: {
        name: "Rokid demo notes",
        originalFileName: "demo-notes.txt",
        fileType: "TXT",
        confidentialMode: true,
        processingStatus: "processing",
      },
    });
  });

  it("stores PDF files with a clear unsupported parser status", async () => {
    const formData = validUploadForm();
    formData.set("file", new File(["fake pdf bytes"], "customer-deck.pdf", { type: "application/pdf" }));

    const response = await uploadMaterial(multipartRequest(formData));

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      status: "processing_not_supported_yet",
      material: {
        fileType: "PDF",
        processingStatus: "processing_not_supported_yet",
        extractionStatus: "processing_not_supported_yet",
      },
    });
  });
});
