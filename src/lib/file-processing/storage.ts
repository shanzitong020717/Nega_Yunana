import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type StoredUpload = {
  storageName: string;
  storagePath: string;
  originalFileName: string;
  size: number;
};

function safeOriginalName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "material";
}

export function getUploadDir() {
  return process.env.UPLOAD_DIR ?? "./storage/uploads";
}

export async function storeUploadedFile(
  file: File,
  uploadDir = getUploadDir(),
): Promise<StoredUpload> {
  await mkdir(uploadDir, { recursive: true });

  const originalFileName = file.name;
  const storageName = `material_${crypto.randomUUID()}_${safeOriginalName(originalFileName)}`;
  const storagePath = join(uploadDir, storageName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(storagePath, buffer);

  return {
    storageName,
    storagePath,
    originalFileName,
    size: file.size,
  };
}

export async function deleteStoredFile(storagePath: string) {
  await rm(storagePath, { force: true });
  return true;
}
