import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { extractTextFromStoredFile } from "@/lib/file-processing/extract-text";

let tempDir: string;

describe("extractTextFromStoredFile", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "rokid-extract-"));
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it("extracts text from TXT files", async () => {
    const storagePath = join(tempDir, "notes.txt");
    await writeFile(storagePath, "Rokid supports real-time translated captions.");

    await expect(
      extractTextFromStoredFile({
        fileType: "TXT",
        storagePath,
        originalFileName: "notes.txt",
      }),
    ).resolves.toEqual({
      status: "extracted",
      text: "Rokid supports real-time translated captions.",
    });
  });

  it("extracts text from Markdown files", async () => {
    const storagePath = join(tempDir, "pilot.md");
    await writeFile(storagePath, "# Pilot\n\n- Define success criteria.");

    await expect(
      extractTextFromStoredFile({
        fileType: "MARKDOWN",
        storagePath,
        originalFileName: "pilot.md",
      }),
    ).resolves.toEqual({
      status: "extracted",
      text: "# Pilot\n\n- Define success criteria.",
    });
  });

  it("returns a clear status when a parser is not supported yet", async () => {
    const storagePath = join(tempDir, "deck.pdf");
    await writeFile(storagePath, "fake pdf bytes");

    await expect(
      extractTextFromStoredFile({
        fileType: "PDF",
        storagePath,
        originalFileName: "deck.pdf",
      }),
    ).resolves.toEqual({
      status: "processing_not_supported_yet",
      text: null,
      message: "Text extraction for PDF is not supported yet.",
    });
  });
});
