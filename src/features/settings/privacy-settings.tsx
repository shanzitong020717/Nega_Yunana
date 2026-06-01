"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";

type DeleteTarget = "material" | "practiceSession" | "transcript" | "review";

type DeleteConfig = {
  target: DeleteTarget;
  title: string;
  label: string;
  fieldName: string;
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
  endpoint: (id: string) => string;
};

const deleteConfigs: DeleteConfig[] = [
  {
    target: "material",
    title: "材料",
    label: "材料 ID",
    fieldName: "materialId",
    placeholder: "material_...",
    buttonLabel: "删除材料",
    successMessage: "材料已删除。",
    endpoint: (id) => `/api/materials/${id}`,
  },
  {
    target: "practiceSession",
    title: "练习会话",
    label: "练习会话 ID",
    fieldName: "practiceSessionId",
    placeholder: "session_...",
    buttonLabel: "删除练习会话",
    successMessage: "练习会话已删除。",
    endpoint: (id) => `/api/practice-sessions/${id}`,
  },
  {
    target: "transcript",
    title: "仅删除转写",
    label: "转写会话 ID",
    fieldName: "transcriptSessionId",
    placeholder: "session_...",
    buttonLabel: "删除转写",
    successMessage: "转写已删除。",
    endpoint: (id) => `/api/practice-sessions/${id}/transcript`,
  },
  {
    target: "review",
    title: "仅删除复盘",
    label: "复盘会话 ID",
    fieldName: "reviewSessionId",
    placeholder: "session_...",
    buttonLabel: "删除复盘",
    successMessage: "复盘已删除。",
    endpoint: (id) => `/api/practice-sessions/${id}/review`,
  },
];

export function PrivacySettings() {
  const [pendingTarget, setPendingTarget] = useState<DeleteTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(
    event: FormEvent<HTMLFormElement>,
    config: DeleteConfig,
  ) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get(config.fieldName) ?? "").trim();

    if (!id) {
      setError(`请填写${config.label}。`);
      return;
    }

    setPendingTarget(config.target);

    try {
      const response = await fetch(config.endpoint(id), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除请求失败");
      }

      form.reset();
      setMessage(config.successMessage);
    } catch {
      setError("删除失败，请检查 ID 后重试。");
    } finally {
      setPendingTarget(null);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">隐私删除控制</h2>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        Delete sensitive customer materials or practice data by ID when a file,
        transcript, or review should no longer be retained.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {deleteConfigs.map((config) => (
          <form
            key={config.target}
            className="rounded-md border border-[var(--border)] bg-white p-4"
            onSubmit={(event) => void handleDelete(event, config)}
          >
            <h3 className="text-sm font-semibold">{config.title}</h3>
            <label
              className="mt-3 flex flex-col gap-2 text-sm font-medium"
              htmlFor={`privacy-${config.fieldName}`}
            >
              {config.label}
              <input
                id={`privacy-${config.fieldName}`}
                name={config.fieldName}
                placeholder={config.placeholder}
                className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>
            <button
              type="submit"
              disabled={pendingTarget === config.target}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pendingTarget === config.target ? "删除中..." : config.buttonLabel}
            </button>
          </form>
        ))}
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-[#b7dfc8] bg-[#edf8f1] px-3 py-2 text-sm font-medium text-[var(--success)]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
