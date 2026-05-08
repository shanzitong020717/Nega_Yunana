"use client";

import { FormEvent, useMemo, useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";

import { StatusPill } from "@/components/status-pill";

const maxUploadSizeBytes = 25 * 1024 * 1024;

const allowedExtensions = [".pdf", ".pptx", ".docx", ".txt", ".md", ".markdown"];

export type UploadedMaterialSummary = {
  id: string;
  name: string;
  originalFileName: string;
  fileType: string;
  processingStatus: string;
  confidentialMode: boolean;
  createdAt: string;
};

type FileLike = Pick<File, "name" | "size" | "type">;

type FileValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

type MaterialUploadProps = {
  onUploaded: (material: UploadedMaterialSummary) => void;
};

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function validateMaterialFile(file: FileLike): FileValidationResult {
  const extension = getFileExtension(file.name);

  if (!allowedExtensions.includes(extension)) {
    return {
      ok: false,
      message: "Unsupported file type. Upload PDF, PPTX, DOCX, TXT, or Markdown.",
    };
  }

  if (file.size > maxUploadSizeBytes) {
    return {
      ok: false,
      message: "File is too large. Keep uploads under 25 MB.",
    };
  }

  return { ok: true };
}

export function MaterialUpload({ onUploaded }: MaterialUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) {
      return "No file selected";
    }

    return `${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} KB)`;
  }, [selectedFile]);

  function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;
    setSubmitError(null);
    setSelectedFile(file);

    if (!file) {
      setFileError(null);
      return;
    }

    const validation = validateMaterialFile(file);
    setFileError(validation.ok ? null : validation.message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const formFile = formData.get("file");
    const file =
      formFile instanceof File && formFile.size > 0 ? formFile : selectedFile;

    if (!(file instanceof File) || file.size === 0) {
      setFileError("Choose a material file before upload.");
      return;
    }

    const validation = validateMaterialFile(file);
    if (!validation.ok) {
      setFileError(validation.message);
      return;
    }

    formData.set("file", file);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        material?: UploadedMaterialSummary;
        error?: { message?: string };
      };

      if (!response.ok || !payload.material) {
        throw new Error(payload.error?.message ?? "Upload failed");
      }

      onUploaded(payload.material);
      form.reset();
      setSelectedFile(null);
      setFileError(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Upload customer material</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Supported formats:{" "}
            <span className="font-medium text-[var(--foreground)]">
              PDF, PPTX, DOCX, TXT, Markdown
            </span>
          </p>
        </div>
        <StatusPill tone="primary">Material brief input</StatusPill>
      </div>

      <div className="mt-5 rounded-md border border-[#f4d39a] bg-[#fff7e8] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold">Privacy warning before upload</h3>
            <div className="mt-2 grid gap-2 text-sm leading-6 text-[var(--muted)]">
              <p>
                <span className="font-medium text-[var(--foreground)]">
                  Confidential by default
                </span>{" "}
                Upload only materials you are allowed to use for training. Keep
                confidential mode on for customer files, meeting notes, and
                demo decks.
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]">
                  默认开启保密模式
                </span>
                。只上传你有权限用于训练的资料。客户文件、会议纪要和演示材料建议始终保持保密模式。
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="material-file">
          Material file
          <input
            id="material-file"
            name="file"
            type="file"
            accept=".pdf,.pptx,.docx,.txt,.md,.markdown"
            onChange={(event) => handleFileChange(event.target.files)}
            className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--surface-subtle)] file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </label>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--muted)]">
          {selectedFileLabel}
        </div>

        {fileError ? (
          <p className="rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]">
            {fileError}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="material-name">
            Material name
            <input
              id="material-name"
              name="name"
              required
              placeholder="Rokid enterprise demo deck"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="customer-type">
            Customer type
            <input
              id="customer-type"
              name="customerType"
              placeholder="Enterprise buyer, distributor, partner"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="customer-industry">
            Customer industry
            <input
              id="customer-industry"
              name="industry"
              placeholder="Healthcare, education, events, manufacturing"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="meeting-goal">
            Meeting goal
            <input
              id="meeting-goal"
              name="meetingGoal"
              placeholder="Book a technical demo, qualify a pilot, handle security questions"
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm font-medium">
          <input
            name="confidentialMode"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Confidential mode
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="material-notes">
          Notes
          <textarea
            id="material-notes"
            name="notes"
            rows={4}
            placeholder="Customer context, expected objections, or specific demo points to practice."
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
          />
        </label>

        {submitError ? (
          <p className="rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            Brief generation uses extracted text when available. PDF, PPTX, and DOCX parser support comes next.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Uploading..." : "Upload material"}
          </button>
        </div>
      </form>
    </section>
  );
}
